import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { albums, albumItems, collectionItems, InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach((field) => {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export type CollectionCondition = "Mint" | "Fine used" | "Used" | "FDC";
export type CollectionItemInput = { stampSlug: string; condition: CollectionCondition; purchasePrice: number; acquiredAt: string; notes: string };
export type AlbumInput = { name: string; description: string; coverStampSlug: string };

const demoItems: CollectionItemInput[] = [
  { stampSlug: "flag-over-capitol", condition: "Mint", purchasePrice: 18, acquiredAt: "2026-08-12", notes: "Crisp margins; acquired from a local club exchange." },
  { stampSlug: "paper-crane", condition: "Fine used", purchasePrice: 12, acquiredAt: "2026-08-08", notes: "Light cancellation, strong colour." },
  { stampSlug: "coral-reef", condition: "Mint", purchasePrice: 24, acquiredAt: "2026-07-30", notes: "Part of a small topical grouping." },
  { stampSlug: "maple-message", condition: "Used", purchasePrice: 7, acquiredAt: "2026-07-19", notes: "A favourite Canadian design study." },
  { stampSlug: "garden-orchid", condition: "Mint", purchasePrice: 29, acquiredAt: "2026-07-11", notes: "Clean example from the botanical album." },
  { stampSlug: "northern-pine", condition: "Fine used", purchasePrice: 8, acquiredAt: "2026-06-28", notes: "Visible circular cancel." },
];

async function ensureDemoCollection(userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: collectionItems.id }).from(collectionItems).where(eq(collectionItems.userId, userId)).limit(1);
  if (existing[0]) return;
  await db.insert(collectionItems).values(demoItems.map((item) => ({ userId, stampSlug: item.stampSlug, condition: item.condition, purchasePrice: String(item.purchasePrice), acquiredAt: new Date(`${item.acquiredAt}T00:00:00.000Z`), notes: item.notes })));
  const createdItems = await db.select().from(collectionItems).where(eq(collectionItems.userId, userId));
  const bySlug = new Map(createdItems.map((item) => [item.stampSlug, item]));
  await db.insert(albums).values([
    { userId, name: "Modern icons", description: "Civic symbols and visual studies from a changing world.", coverStampSlug: "flag-over-capitol" },
    { userId, name: "Small horizons", description: "Flora, forests, and quieter landscape studies.", coverStampSlug: "garden-orchid" },
  ]);
  const createdAlbums = await db.select().from(albums).where(eq(albums.userId, userId));
  const modern = createdAlbums.find((album) => album.name === "Modern icons");
  const horizons = createdAlbums.find((album) => album.name === "Small horizons");
  const assignments = [
    ...(["flag-over-capitol", "paper-crane", "coral-reef"] as const).flatMap((slug, position) => modern && bySlug.get(slug) ? [{ albumId: modern.id, collectionItemId: bySlug.get(slug)!.id, position }] : []),
    ...(["garden-orchid", "northern-pine"] as const).flatMap((slug, position) => horizons && bySlug.get(slug) ? [{ albumId: horizons.id, collectionItemId: bySlug.get(slug)!.id, position }] : []),
  ];
  if (assignments.length) await db.insert(albumItems).values(assignments);
}

export async function listCollectionItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  await ensureDemoCollection(userId);
  return db.select().from(collectionItems).where(eq(collectionItems.userId, userId)).orderBy(desc(collectionItems.createdAt));
}

export async function createCollectionItem(userId: number, input: CollectionItemInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(collectionItems).values({ userId, stampSlug: input.stampSlug, condition: input.condition, purchasePrice: String(input.purchasePrice), acquiredAt: new Date(`${input.acquiredAt}T00:00:00.000Z`), notes: input.notes });
  return listCollectionItems(userId);
}

export async function updateCollectionItem(userId: number, itemId: number, patch: Partial<Omit<CollectionItemInput, "stampSlug">>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const values: Record<string, unknown> = { ...patch };
  if (patch.purchasePrice !== undefined) values.purchasePrice = String(patch.purchasePrice);
  if (patch.acquiredAt !== undefined) values.acquiredAt = new Date(`${patch.acquiredAt}T00:00:00.000Z`);
  await db.update(collectionItems).set(values).where(and(eq(collectionItems.id, itemId), eq(collectionItems.userId, userId)));
  return listCollectionItems(userId);
}

export async function deleteCollectionItem(userId: number, itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(collectionItems).where(and(eq(collectionItems.id, itemId), eq(collectionItems.userId, userId)));
  return listCollectionItems(userId);
}

export async function listAlbums(userId: number) {
  const db = await getDb();
  if (!db) return { albums: [], assignments: [] };
  await ensureDemoCollection(userId);
  const ownedAlbums = await db.select().from(albums).where(eq(albums.userId, userId)).orderBy(desc(albums.updatedAt));
  const assignments = await db.select({ id: albumItems.id, albumId: albumItems.albumId, collectionItemId: albumItems.collectionItemId, position: albumItems.position }).from(albumItems).innerJoin(albums, eq(albumItems.albumId, albums.id)).where(eq(albums.userId, userId)).orderBy(asc(albumItems.position));
  return { albums: ownedAlbums, assignments };
}

export async function createAlbum(userId: number, input: AlbumInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(albums).values({ userId, ...input });
  return listAlbums(userId);
}

export async function updateAlbum(userId: number, albumId: number, patch: Partial<AlbumInput>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(albums).set(patch).where(and(eq(albums.id, albumId), eq(albums.userId, userId)));
  return listAlbums(userId);
}

export async function assignAlbumItem(userId: number, albumId: number | null, collectionItemId: number, position: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const ownedItem = await db.select({ id: collectionItems.id }).from(collectionItems).where(and(eq(collectionItems.id, collectionItemId), eq(collectionItems.userId, userId))).limit(1);
  if (!ownedItem[0]) throw new Error("Collection item unavailable");
  const ownedAlbums = await db.select({ id: albums.id }).from(albums).where(eq(albums.userId, userId));
  const ownedAlbumIds = ownedAlbums.map((album) => album.id);
  if (ownedAlbumIds.length) await db.delete(albumItems).where(and(eq(albumItems.collectionItemId, collectionItemId), inArray(albumItems.albumId, ownedAlbumIds)));
  if (albumId === null) return listAlbums(userId);
  const owned = ownedAlbums.find((album) => album.id === albumId);
  if (!owned) throw new Error("Album unavailable");
  await db.insert(albumItems).values({ albumId, collectionItemId, position }).onDuplicateKeyUpdate({ set: { position } });
  return listAlbums(userId);
}

export async function reorderAlbumItems(userId: number, albumId: number, collectionItemIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const owned = await db.select({ id: albums.id }).from(albums).where(and(eq(albums.id, albumId), eq(albums.userId, userId))).limit(1);
  if (!owned[0]) throw new Error("Album unavailable");
  for (let position = 0; position < collectionItemIds.length; position += 1) {
    const collectionItemId = collectionItemIds[position];
    await db.update(albumItems).set({ position }).where(and(eq(albumItems.albumId, albumId), eq(albumItems.collectionItemId, collectionItemId)));
  }
  return listAlbums(userId);
}
