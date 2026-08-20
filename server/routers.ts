import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import * as db from "./db";

const conditionSchema = z.enum(["Mint", "Fine used", "Used", "FDC"]);
const itemCreateSchema = z.object({ stampSlug: z.string().min(1).max(160), condition: conditionSchema.default("Mint"), purchasePrice: z.number().min(0).max(1_000_000).default(0), acquiredAt: z.string().date(), notes: z.string().max(4000).default("") });
const itemPatchSchema = itemCreateSchema.omit({ stampSlug: true }).partial().extend({ id: z.number().int().positive() });
const albumCreateSchema = z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(1000).default(""), coverStampSlug: z.string().min(1).max(160) });

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
});

export type AppRouter = typeof appRouter;
