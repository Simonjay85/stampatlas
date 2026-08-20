import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { momentCollections, moments } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const createdMomentIds: number[] = [];
const createdCollectionIds: number[] = [];

function userContext(): TrpcContext {
  return { user: { id: 1, openId: "moment-mobile-test", email: "moment@example.com", name: "Moment Test", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

afterEach(async () => {
  const db = await getDb();
  if (!db) return;
  for (const id of createdMomentIds.splice(0)) await db.delete(moments).where(eq(moments.id, id));
  for (const id of createdCollectionIds.splice(0)) await db.delete(momentCollections).where(eq(momentCollections.id, id));
});

describe("moment sync API", () => {
  it("reconciles a mobile draft through create, update, collection membership and pull", async () => {
    const caller = appRouter.createCaller(userContext());
    const created = await caller.moments.create({ title: "A quiet morning", note: "Coffee by the window.", occurredAt: new Date("2026-08-20T06:00:00.000Z"), locationLabel: "Home", mood: "Bình yên", visibility: "private", isFavorite: false, tags: ["morning", "home"], media: [] });
    expect(created?.id).toBeTruthy();
    createdMomentIds.push(created!.id);

    const listed = await caller.moments.list();
    const item = listed.find((moment) => moment.id === created!.id);
    expect(item?.tags.map((tag) => tag?.name)).toEqual(expect.arrayContaining(["morning", "home"]));

    await caller.moments.toggleFavorite({ id: created!.id, isFavorite: true });
    const favorites = await caller.moments.list({ favoriteOnly: true });
    expect(favorites.some((moment) => moment.id === created!.id)).toBe(true);

    const updated = await caller.moments.update({ id: created!.id, title: "A brighter morning", tags: ["morning", "reflection"], visibility: "shared_link" });
    expect(updated?.title).toBe("A brighter morning");
    expect(updated?.tags.map((tag) => tag?.name)).toEqual(expect.arrayContaining(["reflection"]));

    const collection = await caller.moments.collections.create({ title: "Small rituals", description: "A personal archive", coverMediaUrl: null });
    createdCollectionIds.push(collection.id);
    await caller.moments.collections.assign({ momentCollectionId: collection.id, momentId: created!.id, position: 0 });
    const collections = await caller.moments.collections.list();
    expect(collections.find((entry) => entry.id === collection.id)?.momentCount).toBe(1);
    expect(collections.find((entry) => entry.id === collection.id)?.momentIds).toEqual([created!.id]);
    const pulled = await caller.moments.list();
    expect(pulled.find((moment) => moment.id === created!.id)?.title).toBe("A brighter morning");
    expect(pulled.find((moment) => moment.id === created!.id)?.tags.map((tag) => tag?.name)).toEqual(expect.arrayContaining(["reflection"]));
    await caller.moments.collections.replaceItems({ momentCollectionId: collection.id, momentIds: [] });
    const reconciledCollections = await caller.moments.collections.list();
    expect(reconciledCollections.find((entry) => entry.id === collection.id)?.momentCount).toBe(0);
  }, 15_000);
});
