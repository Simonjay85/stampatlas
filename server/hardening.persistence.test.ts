import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

let createdUserIds: number[] = [];

async function createTestUser(role: "user" | "reviewer" | "admin" = "user") {
  const db = await getDb();
  if (!db) throw new Error("Database is required for hardening integration tests");
  const result = await db.insert(users).values({ openId: `hardening-${crypto.randomUUID()}`, name: "Hardening Tester", role });
  const id = Number(result[0].insertId);
  createdUserIds.push(id);
  return id;
}

function contextFor(userId: number): TrpcContext {
  return {
    user: { id: userId, openId: `hardening-${userId}`, email: null, name: "Hardening Tester", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

beforeEach(() => { createdUserIds = []; });
afterEach(async () => {
  const db = await getDb();
  if (!db) return;
  for (const id of createdUserIds) await db.delete(users).where(eq(users.id, id));
});

describe("hardening ownership and public visibility", () => {
  it("rejects a different user attempting to edit or delete a collection item", async () => {
    const ownerId = await createTestUser();
    const otherId = await createTestUser();
    const owner = appRouter.createCaller(contextFor(ownerId));
    const other = appRouter.createCaller(contextFor(otherId));
    const created = await owner.collection.create({ stampSlug: `ownership-${crypto.randomUUID()}`, condition: "Mint", quantity: 1, collectionStatus: "owned", grade: "ungraded", purchasePrice: 0, acquiredAt: "2026-08-20", customTags: [], notes: "owner only" });
    const item = created.find((candidate) => candidate.notes === "owner only");

    await expect(other.collection.update({ id: item!.id, notes: "unauthorized edit" })).rejects.toThrow("Collection item unavailable");
    await expect(other.collection.remove({ id: item!.id })).rejects.toThrow("Collection item unavailable");
  }, 15_000);

  it("rejects duplicate stamp creation for the same collection owner", async () => {
    const userId = await createTestUser();
    const caller = appRouter.createCaller(contextFor(userId));
    const stampSlug = `duplicate-${crypto.randomUUID()}`;
    const input = { stampSlug, condition: "Mint" as const, quantity: 1, collectionStatus: "owned" as const, grade: "ungraded" as const, purchasePrice: 0, acquiredAt: "2026-08-20", customTags: [], notes: "duplicate guard" };
    await caller.collection.create(input);
    await expect(caller.collection.create(input)).rejects.toThrow("Stamp already exists in this collection");
  }, 15_000);

  it("rejects album reorders that omit or introduce items outside the album", async () => {
    const ownerId = await createTestUser();
    const caller = appRouter.createCaller(contextFor(ownerId));
    const item = (await caller.collection.create({ stampSlug: `album-integrity-${crypto.randomUUID()}`, condition: "Mint", quantity: 1, collectionStatus: "owned", grade: "ungraded", purchasePrice: 0, acquiredAt: "2026-08-20", customTags: [], notes: "album integrity" })).find((candidate) => candidate.notes === "album integrity");
    const album = (await caller.albums.create({ name: "Integrity album", description: "", coverStampSlug: item!.stampSlug, visibility: "private" })).albums.find((candidate) => candidate.name === "Integrity album");
    await caller.albums.assignItem({ albumId: album!.id, collectionItemId: item!.id, position: 0 });

    await expect(caller.albums.reorderItems({ albumId: album!.id, collectionItemIds: [999_999] })).rejects.toThrow("Album item order must include each assigned item exactly once");
  }, 15_000);

  it("rejects a different user attempting to update or delete a private identification scan", async () => {
    const ownerId = await createTestUser();
    const otherId = await createTestUser();
    const owner = appRouter.createCaller(contextFor(ownerId));
    const other = appRouter.createCaller(contextFor(otherId));
    const scans = await owner.identification.create({ topCandidateSlug: "flag-over-capitol", candidateSlugs: ["flag-over-capitol"], status: "needs_research", note: "private scan" });
    const scan = scans.find((candidate) => candidate.note === "private scan");

    await expect(other.identification.update({ id: scan!.id, status: "reviewed" })).rejects.toThrow("Identification scan unavailable");
    await expect(other.identification.remove({ id: scan!.id })).rejects.toThrow("Identification scan unavailable");
  });

  it("returns only public albums and their assigned items from a public collector profile", async () => {
    const userId = await createTestUser();
    const caller = appRouter.createCaller(contextFor(userId));
    const suffix = crypto.randomUUID().slice(0, 8);
    const username = `privacy-${suffix}`;
    await caller.profiles.update({ username, displayName: "Privacy Tester", bio: null, avatarUrl: null, isPublic: true });
    const item = (await caller.collection.create({ stampSlug: `profile-privacy-${suffix}`, condition: "Mint", quantity: 1, collectionStatus: "owned", grade: "ungraded", purchasePrice: 0, acquiredAt: "2026-08-20", customTags: [], notes: "public profile fixture" })).find((candidate) => candidate.stampSlug === `profile-privacy-${suffix}`);
    const privateAlbum = (await caller.albums.create({ name: "Private album", description: "", coverStampSlug: item!.stampSlug, visibility: "private" })).albums.find((candidate) => candidate.name === "Private album");
    const publicAlbum = (await caller.albums.create({ name: "Public album", description: "", coverStampSlug: item!.stampSlug, visibility: "public" })).albums.find((candidate) => candidate.name === "Public album");
    await caller.albums.assignItem({ albumId: privateAlbum!.id, collectionItemId: item!.id, position: 0 });
    await caller.albums.assignItem({ albumId: publicAlbum!.id, collectionItemId: item!.id, position: 0 });

    const profile = await appRouter.createCaller({ ...contextFor(userId), user: null }).profiles.public({ username });
    expect(profile?.albums).toHaveLength(1);
    expect(profile?.albums[0]).toMatchObject({ id: publicAlbum!.id, visibility: "public" });
    expect(profile?.items).toEqual([expect.objectContaining({ id: item!.id, stampSlug: item!.stampSlug })]);
    expect(profile?.assignments.every((assignment) => assignment.albumId === publicAlbum!.id)).toBe(true);
  }, 15_000);
});
