import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, protectedProcedure, publicProcedure, reviewerProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import * as db from "./db";
import { storagePut } from "./storage";

const conditionSchema = z.enum(["Mint", "Fine used", "Used", "FDC"]);
const itemCreateSchema = z.object({ stampSlug: z.string().min(1).max(160), condition: conditionSchema.default("Mint"), purchasePrice: z.number().min(0).max(1_000_000).default(0), acquiredAt: z.string().date(), notes: z.string().max(4000).default("") });
const itemPatchSchema = itemCreateSchema.omit({ stampSlug: true }).partial().extend({ id: z.number().int().positive() });
const albumCreateSchema = z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(1000).default(""), coverStampSlug: z.string().min(1).max(160) });
const reuseStatusSchema = z.enum(["public_domain", "cc_by", "permission_granted", "metadata_only", "needs_review", "blocked"]);
const stagedAssetSchema = z.object({ providerAssetId: z.string().min(1).max(255), mediaUrl: z.string().url(), previewUrl: z.string().url().nullable().optional(), mimeType: z.string().max(120).nullable().optional(), creator: z.string().max(4000).nullable().optional(), attribution: z.string().max(8000).nullable().optional(), rightsLabel: z.string().max(255).nullable().optional(), rightsUrl: z.string().url().nullable().optional(), reuseStatus: reuseStatusSchema });
const stagedRecordSchema = z.object({ sourceRecordId: z.string().min(1).max(255), canonicalUrl: z.string().url(), title: z.string().min(1).max(500), country: z.string().max(160).nullable().optional(), issueDate: z.string().max(64).nullable().optional(), denomination: z.string().max(80).nullable().optional(), description: z.string().max(10000).nullable().optional(), reuseStatus: reuseStatusSchema, rightsLabel: z.string().max(255).nullable().optional(), rightsUrl: z.string().url().nullable().optional(), attribution: z.string().max(8000).nullable().optional(), sourcePayload: z.string().min(2).max(60000), assets: z.array(stagedAssetSchema).max(10) });
const momentMediaSchema = z.object({ storageKey: z.string().min(1).max(500), mediaUrl: z.string().min(1).max(4000), mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/heic"]), caption: z.string().trim().max(280).nullable().optional() });
const momentCreateSchema = z.object({ title: z.string().trim().min(1).max(160), note: z.string().trim().max(10000).default(""), occurredAt: z.coerce.date(), locationLabel: z.string().trim().max(255).nullable().optional(), mood: z.string().trim().max(40).nullable().optional(), visibility: z.enum(["private", "shared_link"]).default("private"), isFavorite: z.boolean().default(false), tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]), media: z.array(momentMediaSchema).max(8).default([]) });
const momentUpdateSchema = momentCreateSchema.omit({ media: true }).partial().extend({ id: z.number().int().positive() });

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
    create: protectedProcedure.input(itemCreateSchema).mutation(({ ctx, input }) => db.createCollectionItem(ctx.user.id, input)),
    update: protectedProcedure.input(itemPatchSchema).mutation(({ ctx, input }) => {
      const { id, ...patch } = input;
      return db.updateCollectionItem(ctx.user.id, id, patch);
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteCollectionItem(ctx.user.id, input.id)),
  }),
  albums: router({
    list: protectedProcedure.query(({ ctx }) => db.listAlbums(ctx.user.id)),
    create: protectedProcedure.input(albumCreateSchema).mutation(({ ctx, input }) => db.createAlbum(ctx.user.id, input)),
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
  moments: router({
    list: protectedProcedure.input(z.object({ favoriteOnly: z.boolean().optional(), tagId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => db.listMoments(ctx.user.id, input)),
    tags: protectedProcedure.query(({ ctx }) => db.listMomentTags(ctx.user.id)),
    create: protectedProcedure.input(momentCreateSchema).mutation(({ ctx, input }) => db.createMoment(ctx.user.id, input)),
    update: protectedProcedure.input(momentUpdateSchema).mutation(({ ctx, input }) => {
      const { id, ...patch } = input;
      return db.updateMoment(ctx.user.id, id, patch);
    }),
    toggleFavorite: protectedProcedure.input(z.object({ id: z.number().int().positive(), isFavorite: z.boolean() })).mutation(({ ctx, input }) => db.toggleMomentFavorite(ctx.user.id, input.id, input.isFavorite)),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteMoment(ctx.user.id, input.id)),
    collections: router({
      list: protectedProcedure.query(({ ctx }) => db.listMomentCollections(ctx.user.id)),
      create: protectedProcedure.input(z.object({ title: z.string().trim().min(1).max(120), description: z.string().trim().max(1000).default(""), coverMediaUrl: z.string().max(4000).nullable().optional() })).mutation(({ ctx, input }) => db.createMomentCollection(ctx.user.id, input)),
      assign: protectedProcedure.input(z.object({ momentCollectionId: z.number().int().positive(), momentId: z.number().int().positive(), position: z.number().int().min(0) })).mutation(({ ctx, input }) => db.assignMomentToCollection(ctx.user.id, input.momentCollectionId, input.momentId, input.position)),
      replaceItems: protectedProcedure.input(z.object({ momentCollectionId: z.number().int().positive(), momentIds: z.array(z.number().int().positive()).max(500) })).mutation(({ ctx, input }) => db.replaceMomentCollectionItems(ctx.user.id, input.momentCollectionId, input.momentIds)),
    }),
    uploadMedia: protectedProcedure.input(z.object({ dataUrl: z.string().max(8_500_000), mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/heic"]), filename: z.string().trim().min(1).max(120) })).mutation(async ({ ctx, input }) => {
      const match = input.dataUrl.match(/^data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)$/);
      if (!match || match[1] !== input.mimeType) throw new Error("Invalid image upload payload");
      const bytes = Buffer.from(match[2], "base64");
      if (bytes.length > 6 * 1024 * 1024) throw new Error("Images must be 6MB or smaller");
      const extension = input.mimeType === "image/jpeg" ? "jpg" : input.mimeType.split("/")[1];
      const result = await storagePut(`moments/${ctx.user.id}/${crypto.randomUUID()}.${extension}`, bytes, input.mimeType);
      return { ...result, mimeType: input.mimeType };
    }),
  }),
  externalCatalogue: router({
    list: publicProcedure.query(() => db.listPublishedExternalStamps()),
  }),
});

export type AppRouter = typeof appRouter;
