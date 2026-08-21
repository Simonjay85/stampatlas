import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, protectedProcedure, publicProcedure, reviewerProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import * as db from "./db";
import { storagePut } from "./storage";
import { analyzeStampImage } from "./identificationAi";
import { decodeImageDataUrl } from "./imageUpload";
import { filterStamps, getStamp } from "../client/src/data/catalog";
import { isVisibleCatalogueStamp, normalizeExternalStamp, normalizeSeededStamp } from "../client/src/data/normalizedCatalogue";

const conditionSchema = z.enum(["Mint", "Fine used", "Used", "FDC"]);
const collectionStatusSchema = z.enum(["owned", "wishlist", "duplicate", "swap"]);
const collectionGradeSchema = z.enum(["superb", "very_fine", "fine", "average", "damaged", "ungraded"]);
const itemCreateSchema = z.object({ stampSlug: z.string().min(1).max(160), condition: conditionSchema.default("Mint"), quantity: z.number().int().min(1).max(100_000).default(1), collectionStatus: collectionStatusSchema.default("owned"), grade: collectionGradeSchema.default("ungraded"), purchasePrice: z.number().min(0).max(1_000_000).default(0), acquiredAt: z.string().date(), acquisitionSource: z.string().trim().max(255).nullable().optional(), storageLocation: z.string().trim().max(255).nullable().optional(), albumPage: z.number().int().min(1).max(100_000).nullable().optional(), customTags: z.array(z.string().trim().min(1).max(48)).max(24).default([]), frontImageUrl: z.string().url().max(4000).nullable().optional(), backImageUrl: z.string().url().max(4000).nullable().optional(), notes: z.string().max(4000).default("") });
const itemPatchSchema = itemCreateSchema.omit({ stampSlug: true }).partial().extend({ id: z.number().int().positive() });
const albumCreateSchema = z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(1000).default(""), coverStampSlug: z.string().min(1).max(160), visibility: z.enum(["private", "public"]).default("private") });
const reuseStatusSchema = z.enum(["public_domain", "cc_by", "permission_granted", "metadata_only", "needs_review", "blocked"]);
const stagedAssetSchema = z.object({ providerAssetId: z.string().min(1).max(255), mediaUrl: z.string().url(), previewUrl: z.string().url().nullable().optional(), mimeType: z.string().max(120).nullable().optional(), creator: z.string().max(4000).nullable().optional(), attribution: z.string().max(8000).nullable().optional(), rightsLabel: z.string().max(255).nullable().optional(), rightsUrl: z.string().url().nullable().optional(), reuseStatus: reuseStatusSchema });
const stagedRecordSchema = z.object({ sourceRecordId: z.string().min(1).max(255), canonicalUrl: z.string().url(), title: z.string().min(1).max(500), country: z.string().max(160).nullable().optional(), issueDate: z.string().max(64).nullable().optional(), denomination: z.string().max(80).nullable().optional(), description: z.string().max(10000).nullable().optional(), reuseStatus: reuseStatusSchema, rightsLabel: z.string().max(255).nullable().optional(), rightsUrl: z.string().url().nullable().optional(), attribution: z.string().max(8000).nullable().optional(), sourcePayload: z.string().min(2).max(60000), assets: z.array(stagedAssetSchema).max(10) });
const catalogueSearchSchema = z.object({ query: z.string().trim().max(160).optional(), country: z.string().trim().max(160).optional(), decade: z.string().regex(/^\d{4}s$/).optional(), topic: z.string().trim().max(160).optional(), condition: z.enum(["Mint", "Fine used", "Used", "FDC"]).optional(), source: z.enum(["Wikimedia Commons", "Smithsonian", "Public-domain archive"]).optional(), page: z.number().int().min(0).optional(), limit: z.number().int().min(1).max(48).optional() });
const profileSchema = z.object({ username: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(48), displayName: z.string().trim().min(1).max(120), bio: z.string().trim().max(1200).nullable().optional(), avatarUrl: z.string().url().max(4000).nullable().optional(), isPublic: z.boolean() });
const identificationScanSchema = z.object({ topCandidateSlug: z.string().min(1).max(160).nullable().optional(), candidateSlugs: z.array(z.string().min(1).max(160)).min(1).max(12), status: z.enum(["reviewed", "needs_research", "dismissed"]).default("needs_research"), note: z.string().trim().max(2000).nullable().optional() });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  collection: router({
    list: protectedProcedure.query(({ ctx }) => db.listCollectionItems(ctx.user.id)),
    create: protectedProcedure.input(itemCreateSchema).mutation(({ ctx, input }) => db.createCollectionItem(ctx.user.id, { ...input, quantity: input.quantity ?? 1, collectionStatus: input.collectionStatus ?? "owned", grade: input.grade ?? "ungraded", customTags: input.customTags ?? [] })),
    update: protectedProcedure.input(itemPatchSchema).mutation(({ ctx, input }) => {
      const { id, ...patch } = input;
      return db.updateCollectionItem(ctx.user.id, id, patch);
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteCollectionItem(ctx.user.id, input.id)),
    importCsv: protectedProcedure.input(z.object({ rows: z.array(itemCreateSchema).min(1).max(500) })).mutation(({ ctx, input }) => db.importCollectionItems(ctx.user.id, input.rows.map((row) => ({ ...row, quantity: row.quantity ?? 1, collectionStatus: row.collectionStatus ?? "owned", grade: row.grade ?? "ungraded", customTags: row.customTags ?? [] })))),
    backup: protectedProcedure.query(({ ctx }) => db.getCollectionBackup(ctx.user.id)),
    uploadItemImage: protectedProcedure.input(z.object({ itemId: z.number().int().positive(), side: z.enum(["front", "back"]), dataUrl: z.string().max(8_500_000), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), filename: z.string().trim().min(1).max(120) })).mutation(async ({ ctx, input }) => {
      await db.getCollectionItemForUser(ctx.user.id, input.itemId);
      const bytes = decodeImageDataUrl(input.dataUrl, input.mimeType);
      const extension = input.mimeType === "image/jpeg" ? "jpg" : input.mimeType.split("/")[1];
      const stored = await storagePut(`collection-items/${ctx.user.id}/${input.itemId}/${input.side}-${crypto.randomUUID()}.${extension}`, bytes, input.mimeType);
      await db.updateCollectionItem(ctx.user.id, input.itemId, input.side === "front" ? { frontImageUrl: stored.url } : { backImageUrl: stored.url });
      return { ...stored, side: input.side };
    }),
    removeItemImage: protectedProcedure.input(z.object({ itemId: z.number().int().positive(), side: z.enum(["front", "back"]) })).mutation(async ({ ctx, input }) => {
      await db.getCollectionItemForUser(ctx.user.id, input.itemId);
      return db.updateCollectionItem(ctx.user.id, input.itemId, input.side === "front" ? { frontImageUrl: null } : { backImageUrl: null });
    }),
  }),
  albums: router({
    list: protectedProcedure.query(({ ctx }) => db.listAlbums(ctx.user.id)),
    create: protectedProcedure.input(albumCreateSchema).mutation(({ ctx, input }) => db.createAlbum(ctx.user.id, { ...input, visibility: input.visibility ?? "private" })),
    update: protectedProcedure.input(albumCreateSchema.partial().extend({ id: z.number().int().positive() })).mutation(({ ctx, input }) => {
      const { id, ...patch } = input;
      return db.updateAlbum(ctx.user.id, id, patch);
    }),
    assignItem: protectedProcedure.input(z.object({ albumId: z.number().int().positive().nullable(), collectionItemId: z.number().int().positive(), position: z.number().int().min(0) })).mutation(({ ctx, input }) => db.assignAlbumItem(ctx.user.id, input.albumId, input.collectionItemId, input.position)),
    reorderItems: protectedProcedure.input(z.object({ albumId: z.number().int().positive(), collectionItemIds: z.array(z.number().int().positive()).max(500) })).mutation(({ ctx, input }) => db.reorderAlbumItems(ctx.user.id, input.albumId, input.collectionItemIds)),
  }),
  externalImports: router({
    list: reviewerProcedure.input(z.object({ reviewStatus: z.enum(["pending", "approved", "rejected"]).optional(), lastUpdatedByUserId: z.number().int().positive().optional() }).optional()).query(({ input }) => db.listExternalStampRecords(input)),
    stage: adminProcedure.input(z.object({ provider: z.enum(["wikimedia_commons", "smithsonian"]), query: z.string().min(1).max(500), records: z.array(stagedRecordSchema).min(1).max(100) })).mutation(({ ctx, input }) => db.stageExternalStampRecords(ctx.user.id, input.provider, input.query, input.records)),
    updateMetadata: reviewerProcedure.input(z.object({ id: z.number().int().positive(), country: z.string().trim().max(160).nullable(), eraDecade: z.string().regex(/^\d{4}s$/).nullable() })).mutation(({ ctx, input }) => {
      const { id, ...metadata } = input;
      return db.updateExternalStampMetadata(ctx.user.id, id, metadata);
    }),
    review: reviewerProcedure.input(z.object({ id: z.number().int().positive(), reviewStatus: z.enum(["approved", "rejected"]), reviewNote: z.string().max(4000).default("") })).mutation(({ ctx, input }) => db.reviewExternalStampRecord(ctx.user.id, input.id, input.reviewStatus, input.reviewNote)),
    publish: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.publishExternalStampRecord(ctx.user.id, input.id)),
    pendingSummary: reviewerProcedure.query(() => db.getPendingExternalImportSummary()),
    history: reviewerProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => db.getExternalStampMetadataHistory(input.id)),
    editors: reviewerProcedure.query(() => db.listAdminUsers()),
  }),
  accessControl: router({
    listUsers: adminProcedure.query(() => db.listAdminUsers()),
    updateRole: adminProcedure.input(z.object({ userId: z.number().int().positive(), role: z.enum(["user", "reviewer", "admin"]) })).mutation(({ ctx, input }) => {
      if (ctx.user.id === input.userId) throw new Error("Administrators cannot change their own role");
      return db.updateUserRole(input.userId, input.role);
    }),
  }),
  profiles: router({
    mine: protectedProcedure.query(({ ctx }) => db.getCollectorProfile(ctx.user.id)),
    update: protectedProcedure.input(profileSchema).mutation(({ ctx, input }) => db.updateCollectorProfile(ctx.user.id, input)),
    public: publicProcedure.input(z.object({ username: z.string().trim().toLowerCase().min(3).max(48) })).query(({ input }) => db.getPublicCollectorProfile(input.username)),
  }),
  identification: router({
    list: protectedProcedure.query(({ ctx }) => db.listIdentificationScans(ctx.user.id)),
    create: protectedProcedure.input(identificationScanSchema).mutation(({ ctx, input }) => db.createIdentificationScan(ctx.user.id, { ...input, status: input.status ?? "needs_research" })),
    analyze: protectedProcedure.input(z.object({ dataUrl: z.string().max(8_500_000), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]) })).mutation(async ({ ctx, input }) => {
      decodeImageDataUrl(input.dataUrl, input.mimeType);
      const recognition = await analyzeStampImage(input.dataUrl);
      const candidateSlugs = [recognition.likelySlug, ...recognition.alternativeSlugs].filter((slug): slug is string => Boolean(slug));
      if (!candidateSlugs.length) throw new Error("The image could not be safely matched to a catalogue record. Try a clearer image.");
      await db.createIdentificationScan(ctx.user.id, { topCandidateSlug: recognition.likelySlug, candidateSlugs, status: "needs_research", note: recognition.summary, aiAnalysisJson: JSON.stringify({ confidence: recognition.confidence, visualClues: recognition.visualClues, needsResearch: recognition.needsResearch }), model: recognition.model });
      return recognition;
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["reviewed", "needs_research", "dismissed"]).optional(), note: z.string().trim().max(2000).nullable().optional() })).mutation(({ ctx, input }) => { const { id, ...patch } = input; return db.updateIdentificationScan(ctx.user.id, id, patch); }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteIdentificationScan(ctx.user.id, input.id)),
  }),
  externalCatalogue: router({
    list: publicProcedure.query(() => db.listPublishedExternalStamps()),
    search: publicProcedure.input(z.object({ query: z.string().trim().max(160).optional(), country: z.string().trim().max(160).optional(), decade: z.string().regex(/^\d{4}s$/).optional(), provider: z.enum(["wikimedia_commons", "smithsonian"]).optional(), page: z.number().int().min(0).optional(), limit: z.number().int().min(1).max(48).optional() }).optional()).query(({ input }) => db.queryPublishedExternalStamps(input)),
    bySlug: publicProcedure.input(z.object({ slug: z.string().trim().min(1).max(180) })).query(({ input }) => db.getPublishedExternalStampBySlug(input.slug)),
  }),
  catalogue: router({
    list: publicProcedure.input(catalogueSearchSchema.optional()).query(async ({ input }) => {
      const filters = input ?? {};
      const limit = filters.limit ?? 24;
      const page = filters.page ?? 0;
      const seeded = filterStamps({ query: filters.query, country: filters.country, decade: filters.decade, topic: filters.topic, condition: filters.condition, source: filters.source }).map(normalizeSeededStamp);
      const offset = page * limit;
      const seededPage = seeded.slice(offset, offset + limit);
      const externalOffset = Math.max(0, offset - seeded.length);
      const remaining = limit - seededPage.length;
      const provider = (filters.source === "Wikimedia Commons" ? "wikimedia_commons" : filters.source === "Smithsonian" ? "smithsonian" : undefined) as "wikimedia_commons" | "smithsonian" | undefined;
      const externalPage = remaining > 0 ? await db.queryPublishedExternalStamps({ query: filters.query, country: filters.country, decade: filters.decade, provider, offset: externalOffset, limit: remaining }) : { items: [], nextOffset: null };
      const external = externalPage.items.map((record) => normalizeExternalStamp(record as Parameters<typeof normalizeExternalStamp>[0])).filter(isVisibleCatalogueStamp).filter((stamp) => (!filters.topic || stamp.topic === filters.topic) && (!filters.condition || stamp.condition === filters.condition));
      return { items: Array.from(new Map([...seededPage, ...external].map((stamp) => [stamp.slug, stamp])).values()), nextPage: offset + limit < seeded.length || externalPage.nextOffset !== null ? page + 1 : null };
    }),
    bySlug: publicProcedure.input(z.object({ slug: z.string().trim().min(1).max(180) })).query(async ({ input }) => {
      const seeded = getStamp(input.slug);
      if (seeded) return normalizeSeededStamp(seeded);
      const external = await db.getPublishedExternalStampBySlug(input.slug);
      return external ? normalizeExternalStamp(external as Parameters<typeof normalizeExternalStamp>[0]) : null;
    }),
    bySlugs: publicProcedure.input(z.object({ slugs: z.array(z.string().trim().min(1).max(180)).min(1).max(500) })).query(async ({ input }) => {
      const seeded = input.slugs.flatMap((slug) => { const stamp = getStamp(slug); return stamp ? [normalizeSeededStamp(stamp)] : []; });
      const externalSlugs = input.slugs.filter((slug) => !getStamp(slug));
      const external = await db.getPublishedExternalStampsBySlugs(externalSlugs);
      return [...seeded, ...external.map((record) => normalizeExternalStamp(record as Parameters<typeof normalizeExternalStamp>[0]))];
    }),
  }),
});

export type AppRouter = typeof appRouter;
