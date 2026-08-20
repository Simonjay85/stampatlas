import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import * as db from "./db";

const conditionSchema = z.enum(["Mint", "Fine used", "Used", "FDC"]);
const itemCreateSchema = z.object({ stampSlug: z.string().min(1).max(160), condition: conditionSchema.default("Mint"), purchasePrice: z.number().min(0).max(1_000_000).default(0), acquiredAt: z.string().date(), notes: z.string().max(4000).default("") });
const itemPatchSchema = itemCreateSchema.omit({ stampSlug: true }).partial().extend({ id: z.number().int().positive() });
const albumCreateSchema = z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(1000).default(""), coverStampSlug: z.string().min(1).max(160) });
const reuseStatusSchema = z.enum(["public_domain", "cc_by", "permission_granted", "metadata_only", "needs_review", "blocked"]);
const stagedAssetSchema = z.object({ providerAssetId: z.string().min(1).max(255), mediaUrl: z.string().url(), previewUrl: z.string().url().nullable().optional(), mimeType: z.string().max(120).nullable().optional(), creator: z.string().max(4000).nullable().optional(), attribution: z.string().max(8000).nullable().optional(), rightsLabel: z.string().max(255).nullable().optional(), rightsUrl: z.string().url().nullable().optional(), reuseStatus: reuseStatusSchema });
const stagedRecordSchema = z.object({ sourceRecordId: z.string().min(1).max(255), canonicalUrl: z.string().url(), title: z.string().min(1).max(500), country: z.string().max(160).nullable().optional(), issueDate: z.string().max(64).nullable().optional(), denomination: z.string().max(80).nullable().optional(), description: z.string().max(10000).nullable().optional(), reuseStatus: reuseStatusSchema, rightsLabel: z.string().max(255).nullable().optional(), rightsUrl: z.string().url().nullable().optional(), attribution: z.string().max(8000).nullable().optional(), sourcePayload: z.string().min(2).max(60000), assets: z.array(stagedAssetSchema).max(10) });

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
    list: adminProcedure.input(z.object({ reviewStatus: z.enum(["pending", "approved", "rejected"]).optional() }).optional()).query(({ input }) => db.listExternalStampRecords(input?.reviewStatus)),
    stage: adminProcedure.input(z.object({ provider: z.enum(["wikimedia_commons", "smithsonian"]), query: z.string().min(1).max(500), records: z.array(stagedRecordSchema).min(1).max(100) })).mutation(({ ctx, input }) => db.stageExternalStampRecords(ctx.user.id, input.provider, input.query, input.records)),
    review: adminProcedure.input(z.object({ id: z.number().int().positive(), reviewStatus: z.enum(["approved", "rejected"]), reviewNote: z.string().max(4000).default("") })).mutation(({ ctx, input }) => db.reviewExternalStampRecord(ctx.user.id, input.id, input.reviewStatus, input.reviewNote)),
    publish: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.publishExternalStampRecord(ctx.user.id, input.id)),
  }),
  externalCatalogue: router({
    list: publicProcedure.query(() => db.listPublishedExternalStamps()),
  }),
});

export type AppRouter = typeof appRouter;
