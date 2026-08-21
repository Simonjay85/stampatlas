import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function authenticatedContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "stampatlas-persistence-test-user",
      email: "collector@example.com",
      name: "Collection Tester",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("persistent collection data", () => {
  it("returns the authenticated user’s seeded collection and album records", async () => {
    const caller = appRouter.createCaller(authenticatedContext());
    const items = await caller.collection.list();
    const albumData = await caller.albums.list();

    expect(items.length).toBeGreaterThanOrEqual(6);
    expect(items[0]).toMatchObject({ quantity: 1, collectionStatus: "owned", grade: "ungraded" });
    expect(albumData.albums.length).toBeGreaterThanOrEqual(2);
    expect(albumData.assignments.length).toBeGreaterThanOrEqual(5);
  }, 15_000);

  it("imports validated inventory rows and skips duplicate slugs", async () => {
    const caller = appRouter.createCaller(authenticatedContext());
    const slug = `import-test-${Date.now()}`;
    const first = await caller.collection.importCsv({ rows: [{ stampSlug: slug, condition: "Mint", quantity: 2, collectionStatus: "swap", grade: "very_fine", purchasePrice: 10, acquiredAt: "2026-08-20", acquisitionSource: "Club exchange", storageLocation: "Box A", albumPage: 4, customTags: ["trade", "test"], notes: "Import coverage" }] });
    expect(first).toMatchObject({ createdCount: 1, skippedCount: 0 });
    const second = await caller.collection.importCsv({ rows: [{ stampSlug: slug, condition: "Mint", quantity: 2, collectionStatus: "swap", grade: "very_fine", purchasePrice: 10, acquiredAt: "2026-08-20", customTags: [], notes: "" }] });
    expect(second).toMatchObject({ createdCount: 0, skippedCount: 1 });
    const item = (await caller.collection.list()).find((candidate) => candidate.stampSlug === slug);
    expect(item).toMatchObject({ quantity: 2, collectionStatus: "swap", grade: "very_fine", storageLocation: "Box A" });
    await caller.collection.remove({ id: item!.id });
  }, 15_000);

  it("clears only the authenticated user’s front or back image reference", async () => {
    const caller = appRouter.createCaller(authenticatedContext());
    const slug = `image-remove-test-${Date.now()}`;
    const created = await caller.collection.create({ stampSlug: slug, condition: "Mint", quantity: 1, collectionStatus: "owned", grade: "ungraded", acquiredAt: "2026-08-20", customTags: [], frontImageUrl: "https://example.com/test-front.png", backImageUrl: "https://example.com/test-back.png" });
    const withImages = (await caller.collection.list()).find((item) => item.stampSlug === slug);
    expect(withImages).toMatchObject({ frontImageUrl: "https://example.com/test-front.png", backImageUrl: "https://example.com/test-back.png" });
    await caller.collection.removeItemImage({ itemId: withImages!.id, side: "front" });
    const afterRemoval = (await caller.collection.list()).find((item) => item.id === withImages!.id);
    expect(afterRemoval).toMatchObject({ frontImageUrl: null, backImageUrl: "https://example.com/test-back.png" });
    await caller.collection.remove({ id: withImages!.id });
    expect(created).toBeDefined();
  }, 15_000);
});
