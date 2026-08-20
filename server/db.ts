import { and, asc, desc, eq, inArray, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { albums, albumItems, collectionItems, collectorProfiles, externalImportJobs, externalStampAssets, externalStampMetadataHistory, externalStampRecords, identificationScans, InsertUser, momentCollectionItems, momentCollections, momentMedia, momentTagAssignments, momentTags, moments, publishedExternalStamps, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { classifyImportedStamp } from "./importers/classify";

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
export type CollectionStatus = "owned" | "wishlist" | "duplicate" | "swap";
export type CollectionGrade = "superb" | "very_fine" | "fine" | "average" | "damaged" | "ungraded";
export type CollectionItemInput = { stampSlug: string; condition: CollectionCondition; quantity: number; collectionStatus: CollectionStatus; grade: CollectionGrade; purchasePrice: number; acquiredAt: string; acquisitionSource?: string | null; storageLocation?: string | null; albumPage?: number | null; customTags: string[]; frontImageUrl?: string | null; backImageUrl?: string | null; notes: string };
export type AlbumInput = { name: string; description: string; coverStampSlug: string; visibility: "private" | "public" };
export type ReuseStatus = "public_domain" | "cc_by" | "permission_granted" | "metadata_only" | "needs_review" | "blocked";
export type ImportedAssetInput = { providerAssetId: string; mediaUrl: string; previewUrl?: string | null; mimeType?: string | null; creator?: string | null; attribution?: string | null; rightsLabel?: string | null; rightsUrl?: string | null; reuseStatus: ReuseStatus };
export type ImportedStampInput = { sourceRecordId: string; canonicalUrl: string; title: string; country?: string | null; issueDate?: string | null; denomination?: string | null; description?: string | null; reuseStatus: ReuseStatus; rightsLabel?: string | null; rightsUrl?: string | null; attribution?: string | null; sourcePayload: string; assets: ImportedAssetInput[] };

const demoItems: CollectionItemInput[] = [
  { stampSlug: "flag-over-capitol", condition: "Mint", quantity: 1, collectionStatus: "owned", grade: "ungraded", customTags: [], purchasePrice: 18, acquiredAt: "2026-08-12", notes: "Crisp margins; acquired from a local club exchange." },
  { stampSlug: "paper-crane", condition: "Fine used", quantity: 1, collectionStatus: "owned", grade: "ungraded", customTags: [], purchasePrice: 12, acquiredAt: "2026-08-08", notes: "Light cancellation, strong colour." },
  { stampSlug: "coral-reef", condition: "Mint", quantity: 1, collectionStatus: "owned", grade: "ungraded", customTags: [], purchasePrice: 24, acquiredAt: "2026-07-30", notes: "Part of a small topical grouping." },
  { stampSlug: "maple-message", condition: "Used", quantity: 1, collectionStatus: "owned", grade: "ungraded", customTags: [], purchasePrice: 7, acquiredAt: "2026-07-19", notes: "A favourite Canadian design study." },
  { stampSlug: "garden-orchid", condition: "Mint", quantity: 1, collectionStatus: "owned", grade: "ungraded", customTags: [], purchasePrice: 29, acquiredAt: "2026-07-11", notes: "Clean example from the botanical album." },
  { stampSlug: "northern-pine", condition: "Fine used", quantity: 1, collectionStatus: "owned", grade: "ungraded", customTags: [], purchasePrice: 8, acquiredAt: "2026-06-28", notes: "Visible circular cancel." },
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
  await db.insert(collectionItems).values({ userId, stampSlug: input.stampSlug, condition: input.condition, quantity: input.quantity, collectionStatus: input.collectionStatus, grade: input.grade, purchasePrice: String(input.purchasePrice), acquiredAt: new Date(`${input.acquiredAt}T00:00:00.000Z`), acquisitionSource: input.acquisitionSource ?? null, storageLocation: input.storageLocation ?? null, albumPage: input.albumPage ?? null, customTags: JSON.stringify(input.customTags), frontImageUrl: input.frontImageUrl ?? null, backImageUrl: input.backImageUrl ?? null, notes: input.notes });
  return listCollectionItems(userId);
}

export async function updateCollectionItem(userId: number, itemId: number, patch: Partial<Omit<CollectionItemInput, "stampSlug">>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const values: Record<string, unknown> = { ...patch };
  if (patch.purchasePrice !== undefined) values.purchasePrice = String(patch.purchasePrice);
  if (patch.acquiredAt !== undefined) values.acquiredAt = new Date(`${patch.acquiredAt}T00:00:00.000Z`);
  if (patch.customTags !== undefined) values.customTags = JSON.stringify(patch.customTags);
  await db.update(collectionItems).set(values).where(and(eq(collectionItems.id, itemId), eq(collectionItems.userId, userId)));
  return listCollectionItems(userId);
}

export async function deleteCollectionItem(userId: number, itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(collectionItems).where(and(eq(collectionItems.id, itemId), eq(collectionItems.userId, userId)));
  return listCollectionItems(userId);
}

export async function getCollectionItemForUser(userId: number, itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const item = await db.select({ id: collectionItems.id }).from(collectionItems).where(and(eq(collectionItems.id, itemId), eq(collectionItems.userId, userId))).limit(1);
  if (!item[0]) throw new Error("Collection item unavailable");
  return item[0];
}

export async function importCollectionItems(userId: number, input: CollectionItemInput[]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select({ stampSlug: collectionItems.stampSlug }).from(collectionItems).where(eq(collectionItems.userId, userId));
  const known = new Set(existing.map((item) => item.stampSlug));
  const created: string[] = []; const skipped: string[] = [];
  for (const item of input) {
    if (known.has(item.stampSlug)) { skipped.push(item.stampSlug); continue; }
    await db.insert(collectionItems).values({ userId, stampSlug: item.stampSlug, condition: item.condition, quantity: item.quantity, collectionStatus: item.collectionStatus, grade: item.grade, purchasePrice: String(item.purchasePrice), acquiredAt: new Date(`${item.acquiredAt}T00:00:00.000Z`), acquisitionSource: item.acquisitionSource ?? null, storageLocation: item.storageLocation ?? null, albumPage: item.albumPage ?? null, customTags: JSON.stringify(item.customTags), frontImageUrl: item.frontImageUrl ?? null, backImageUrl: item.backImageUrl ?? null, notes: item.notes });
    known.add(item.stampSlug); created.push(item.stampSlug);
  }
  return { createdCount: created.length, skippedCount: skipped.length, created, skipped };
}

export async function getCollectionBackup(userId: number) {
  const [items, albumData] = await Promise.all([listCollectionItems(userId), listAlbums(userId)]);
  return { format: "stampatlas-collection-backup", version: 1, exportedAt: new Date().toISOString(), items, albums: albumData.albums, assignments: albumData.assignments };
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

export async function stageExternalStampRecords(requestedByUserId: number, provider: "wikimedia_commons" | "smithsonian", query: string, records: ImportedStampInput[]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const created = await db.insert(externalImportJobs).values({ provider, query, requestedByUserId, status: "queued", receivedCount: records.length });
  const importJobId = Number(created[0].insertId);
  let stagedCount = 0;
  for (const record of records) {
    const classification = classifyImportedStamp(record);
    await db.insert(externalStampRecords).values({ importJobId, provider, sourceRecordId: record.sourceRecordId, canonicalUrl: record.canonicalUrl, title: record.title, country: record.country ?? null, normalizedCountry: classification.normalizedCountry, issueDate: record.issueDate ?? null, eraDecade: classification.eraDecade, classificationMethod: classification.classificationMethod, classificationConfidence: classification.classificationConfidence, denomination: record.denomination ?? null, description: record.description ?? null, reuseStatus: record.reuseStatus, rightsLabel: record.rightsLabel ?? null, rightsUrl: record.rightsUrl ?? null, attribution: record.attribution ?? null, sourcePayload: record.sourcePayload }).onDuplicateKeyUpdate({ set: { importJobId, canonicalUrl: record.canonicalUrl, title: record.title, country: record.country ?? null, normalizedCountry: classification.normalizedCountry, issueDate: record.issueDate ?? null, eraDecade: classification.eraDecade, classificationMethod: classification.classificationMethod, classificationConfidence: classification.classificationConfidence, denomination: record.denomination ?? null, description: record.description ?? null, reuseStatus: record.reuseStatus, rightsLabel: record.rightsLabel ?? null, rightsUrl: record.rightsUrl ?? null, attribution: record.attribution ?? null, sourcePayload: record.sourcePayload, sourceRetrievedAt: new Date() } });
    const staged = await db.select({ id: externalStampRecords.id }).from(externalStampRecords).where(and(eq(externalStampRecords.provider, provider), eq(externalStampRecords.sourceRecordId, record.sourceRecordId))).limit(1);
    const stagedRecord = staged[0];
    if (!stagedRecord) continue;
    stagedCount += 1;
    for (const asset of record.assets) await db.insert(externalStampAssets).values({ externalStampRecordId: stagedRecord.id, providerAssetId: asset.providerAssetId, mediaUrl: asset.mediaUrl, previewUrl: asset.previewUrl ?? null, mimeType: asset.mimeType ?? null, creator: asset.creator ?? null, attribution: asset.attribution ?? null, rightsLabel: asset.rightsLabel ?? null, rightsUrl: asset.rightsUrl ?? null, reuseStatus: asset.reuseStatus }).onDuplicateKeyUpdate({ set: { mediaUrl: asset.mediaUrl, previewUrl: asset.previewUrl ?? null, mimeType: asset.mimeType ?? null, creator: asset.creator ?? null, attribution: asset.attribution ?? null, rightsLabel: asset.rightsLabel ?? null, rightsUrl: asset.rightsUrl ?? null, reuseStatus: asset.reuseStatus, sourceRetrievedAt: new Date() } });
  }
  await db.update(externalImportJobs).set({ status: "completed", stagedCount, completedAt: new Date() }).where(eq(externalImportJobs.id, importJobId));
  return { importJobId, receivedCount: records.length, stagedCount };
}

export type ExternalImportFilter = { reviewStatus?: "pending" | "approved" | "rejected"; lastUpdatedByUserId?: number };

export async function listExternalStampRecords(filters?: ExternalImportFilter) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(externalStampRecords).orderBy(desc(externalStampRecords.updatedAt));
  const conditions = [filters?.reviewStatus ? eq(externalStampRecords.reviewStatus, filters.reviewStatus) : undefined, filters?.lastUpdatedByUserId ? eq(externalStampRecords.lastUpdatedByUserId, filters.lastUpdatedByUserId) : undefined].filter(Boolean);
  const records = conditions.length ? await query.where(and(...conditions)) : await query;
  if (!records.length) return [];
  const assets = await db.select().from(externalStampAssets).where(inArray(externalStampAssets.externalStampRecordId, records.map((record) => record.id)));
  return records.map((record) => ({ ...record, assets: assets.filter((asset) => asset.externalStampRecordId === record.id) }));
}

export async function reviewExternalStampRecord(reviewerUserId: number, recordId: number, reviewStatus: "approved" | "rejected", reviewNote: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(externalStampRecords).set({ reviewStatus, reviewNote, reviewedByUserId: reviewerUserId, reviewedAt: new Date(), lastUpdatedByUserId: reviewerUserId, updatedAt: new Date() }).where(eq(externalStampRecords.id, recordId));
  return listExternalStampRecords();
}

export async function updateExternalStampMetadata(editorUserId: number, recordId: number, metadata: { country: string | null; eraDecade: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const before = await db.select().from(externalStampRecords).where(eq(externalStampRecords.id, recordId)).limit(1);
  if (!before[0]) throw new Error("Imported record unavailable");
  const countryChanged = before[0].country !== metadata.country;
  const decadeChanged = before[0].eraDecade !== metadata.eraDecade;
  if (countryChanged || decadeChanged) await db.insert(externalStampMetadataHistory).values({ externalStampRecordId: recordId, changedByUserId: editorUserId, previousCountry: before[0].country, nextCountry: metadata.country, previousEraDecade: before[0].eraDecade, nextEraDecade: metadata.eraDecade });
  await db.update(externalStampRecords).set({ country: metadata.country, normalizedCountry: metadata.country, eraDecade: metadata.eraDecade, classificationMethod: "manual_override", classificationConfidence: 100, lastUpdatedByUserId: editorUserId, updatedAt: new Date() }).where(eq(externalStampRecords.id, recordId));
  const updated = await db.select().from(externalStampRecords).where(eq(externalStampRecords.id, recordId)).limit(1);
  if (!updated[0]) throw new Error("Imported record unavailable");
  return updated[0];
}

export async function getExternalStampMetadataHistory(recordId: number) {
  const db = await getDb();
  if (!db) return [];
  const history = await db.select().from(externalStampMetadataHistory).where(eq(externalStampMetadataHistory.externalStampRecordId, recordId)).orderBy(desc(externalStampMetadataHistory.changedAt));
  if (!history.length) return [];
  const editorIds = Array.from(new Set(history.map((item) => item.changedByUserId).filter((id): id is number => id !== null)));
  const editors = editorIds.length ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, editorIds)) : [];
  return history.map((item) => ({ ...item, changedBy: editors.find((editor) => editor.id === item.changedByUserId) ?? null }));
}

export async function listAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.lastSignedIn));
}

export async function updateUserRole(userId: number, role: "user" | "reviewer" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(users).set({ role }).where(eq(users.id, userId));
  const updated = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn }).from(users).where(eq(users.id, userId)).limit(1);
  if (!updated[0]) throw new Error("User unavailable");
  return updated[0];
}

function profileUsername(name: string | null, userId: number) { return `${(name || "collector").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "collector"}-${userId}`; }
export async function getCollectorProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(collectorProfiles).where(eq(collectorProfiles.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  const user = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
  await db.insert(collectorProfiles).values({ userId, username: profileUsername(user[0]?.name ?? null, userId), displayName: user[0]?.name || "Collector", isPublic: false });
  return (await db.select().from(collectorProfiles).where(eq(collectorProfiles.userId, userId)).limit(1))[0] ?? null;
}
export async function updateCollectorProfile(userId: number, input: { username: string; displayName: string; bio?: string | null; avatarUrl?: string | null; isPublic: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await getCollectorProfile(userId);
  await db.update(collectorProfiles).set(input).where(eq(collectorProfiles.userId, userId));
  return getCollectorProfile(userId);
}
export async function getPublicCollectorProfile(username: string) {
  const db = await getDb();
  if (!db) return null;
  const profile = await db.select().from(collectorProfiles).where(and(eq(collectorProfiles.username, username), eq(collectorProfiles.isPublic, true))).limit(1);
  if (!profile[0]) return null;
  const publicAlbums = await db.select().from(albums).where(and(eq(albums.userId, profile[0].userId), eq(albums.visibility, "public"))).orderBy(desc(albums.updatedAt));
  const albumIds = publicAlbums.map((album) => album.id);
  if (!albumIds.length) return { profile: profile[0], albums: [], assignments: [], items: [] };
  const assignments = await db.select({ albumId: albumItems.albumId, collectionItemId: albumItems.collectionItemId, position: albumItems.position }).from(albumItems).where(inArray(albumItems.albumId, albumIds)).orderBy(asc(albumItems.position));
  const itemIds = assignments.map((assignment) => assignment.collectionItemId);
  const items = itemIds.length ? await db.select({ id: collectionItems.id, stampSlug: collectionItems.stampSlug, condition: collectionItems.condition, quantity: collectionItems.quantity, grade: collectionItems.grade, frontImageUrl: collectionItems.frontImageUrl, backImageUrl: collectionItems.backImageUrl }).from(collectionItems).where(inArray(collectionItems.id, itemIds)) : [];
  return { profile: profile[0], albums: publicAlbums, assignments, items };
}

export async function getPendingExternalImportSummary() {
  const pending = await listExternalStampRecords({ reviewStatus: "pending" });
  return {
    count: pending.length,
    newestRetrievedAt: pending[0]?.sourceRetrievedAt ?? null,
  };
}

function publishableSlug(title: string, sourceRecordId: string) {
  const normalized = title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140);
  const suffix = sourceRecordId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(-30) || "record";
  return `${normalized || "external-stamp"}-${suffix}`.slice(0, 180);
}

export async function publishExternalStampRecord(publisherUserId: number, recordId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const record = await db.select().from(externalStampRecords).where(and(eq(externalStampRecords.id, recordId), eq(externalStampRecords.reviewStatus, "approved"))).limit(1);
  const approved = record[0];
  if (!approved) throw new Error("Only approved external records can be published");
  if (!["public_domain", "cc_by", "permission_granted"].includes(approved.reuseStatus)) throw new Error("The record lacks a publishable rights status");
  const slug = publishableSlug(approved.title, approved.sourceRecordId);
  await db.insert(publishedExternalStamps).values({ externalStampRecordId: approved.id, slug, publishedByUserId: publisherUserId }).onDuplicateKeyUpdate({ set: { slug, publishedByUserId: publisherUserId, publishedAt: new Date() } });
  return { slug, externalStampRecordId: approved.id };
}

export type PublicExternalCatalogueFilter = { query?: string; country?: string; decade?: string; provider?: "wikimedia_commons" | "smithsonian"; page?: number; offset?: number; limit?: number };

export async function queryPublishedExternalStamps(filters: PublicExternalCatalogueFilter = {}) {
  const db = await getDb();
  if (!db) return { items: [], nextPage: null, nextOffset: null };
  const page = Math.max(0, filters.page ?? 0);
  const limit = Math.min(48, Math.max(1, filters.limit ?? 24));
  const offset = Math.max(0, filters.offset ?? page * limit);
  const query = filters.query?.trim();
  const conditions = [
    eq(externalStampRecords.reviewStatus, "approved"),
    filters.provider ? eq(externalStampRecords.provider, filters.provider) : undefined,
    filters.country ? or(eq(externalStampRecords.normalizedCountry, filters.country), eq(externalStampRecords.country, filters.country)) : undefined,
    filters.decade ? eq(externalStampRecords.eraDecade, filters.decade) : undefined,
    query ? or(like(externalStampRecords.title, `%${query}%`), like(externalStampRecords.country, `%${query}%`), like(externalStampRecords.normalizedCountry, `%${query}%`), like(externalStampRecords.issueDate, `%${query}%`)) : undefined,
  ].filter(Boolean);
  const records = await db.select({ id: publishedExternalStamps.id, externalStampRecordId: publishedExternalStamps.externalStampRecordId, slug: publishedExternalStamps.slug, publishedAt: publishedExternalStamps.publishedAt, sourceRecordId: externalStampRecords.sourceRecordId, provider: externalStampRecords.provider, canonicalUrl: externalStampRecords.canonicalUrl, title: externalStampRecords.title, country: externalStampRecords.country, normalizedCountry: externalStampRecords.normalizedCountry, issueDate: externalStampRecords.issueDate, eraDecade: externalStampRecords.eraDecade, denomination: externalStampRecords.denomination, description: externalStampRecords.description, reuseStatus: externalStampRecords.reuseStatus, rightsLabel: externalStampRecords.rightsLabel, rightsUrl: externalStampRecords.rightsUrl, attribution: externalStampRecords.attribution }).from(publishedExternalStamps).innerJoin(externalStampRecords, eq(publishedExternalStamps.externalStampRecordId, externalStampRecords.id)).where(and(...conditions)).orderBy(desc(publishedExternalStamps.publishedAt)).limit(limit + 1).offset(offset);
  if (!records.length) return { items: [], nextPage: null, nextOffset: null };
  const pageRecords = records.slice(0, limit);
  const assets = await db.select().from(externalStampAssets).where(inArray(externalStampAssets.externalStampRecordId, pageRecords.map((record) => record.externalStampRecordId)));
  const hasNext = records.length > limit;
  return { items: pageRecords.map((record) => ({ ...record, assets: assets.filter((asset) => asset.externalStampRecordId === record.externalStampRecordId) })), nextPage: hasNext ? Math.floor((offset + limit) / limit) : null, nextOffset: hasNext ? offset + limit : null };
}

export async function listPublishedExternalStamps() {
  return (await queryPublishedExternalStamps({ limit: 48 })).items;
}

export async function getPublishedExternalStampBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const records = await db.select({ id: publishedExternalStamps.id, externalStampRecordId: publishedExternalStamps.externalStampRecordId, slug: publishedExternalStamps.slug, provider: externalStampRecords.provider, canonicalUrl: externalStampRecords.canonicalUrl, title: externalStampRecords.title, country: externalStampRecords.country, normalizedCountry: externalStampRecords.normalizedCountry, issueDate: externalStampRecords.issueDate, eraDecade: externalStampRecords.eraDecade, denomination: externalStampRecords.denomination, description: externalStampRecords.description, rightsLabel: externalStampRecords.rightsLabel, attribution: externalStampRecords.attribution }).from(publishedExternalStamps).innerJoin(externalStampRecords, eq(publishedExternalStamps.externalStampRecordId, externalStampRecords.id)).where(and(eq(publishedExternalStamps.slug, slug), eq(externalStampRecords.reviewStatus, "approved"))).limit(1);
  const record = records[0];
  if (!record) return null;
  const assets = await db.select().from(externalStampAssets).where(eq(externalStampAssets.externalStampRecordId, record.externalStampRecordId));
  return { ...record, assets };
}

export async function getPublishedExternalStampsBySlugs(slugs: string[]) {
  const uniqueSlugs = Array.from(new Set(slugs)).slice(0, 500);
  const db = await getDb();
  if (!db || !uniqueSlugs.length) return [];
  const records = await db.select({ id: publishedExternalStamps.id, externalStampRecordId: publishedExternalStamps.externalStampRecordId, slug: publishedExternalStamps.slug, provider: externalStampRecords.provider, canonicalUrl: externalStampRecords.canonicalUrl, title: externalStampRecords.title, country: externalStampRecords.country, normalizedCountry: externalStampRecords.normalizedCountry, issueDate: externalStampRecords.issueDate, eraDecade: externalStampRecords.eraDecade, denomination: externalStampRecords.denomination, description: externalStampRecords.description, rightsLabel: externalStampRecords.rightsLabel, attribution: externalStampRecords.attribution }).from(publishedExternalStamps).innerJoin(externalStampRecords, eq(publishedExternalStamps.externalStampRecordId, externalStampRecords.id)).where(and(inArray(publishedExternalStamps.slug, uniqueSlugs), eq(externalStampRecords.reviewStatus, "approved")));
  if (!records.length) return [];
  const assets = await db.select().from(externalStampAssets).where(inArray(externalStampAssets.externalStampRecordId, records.map((record) => record.externalStampRecordId)));
  return records.map((record) => ({ ...record, assets: assets.filter((asset) => asset.externalStampRecordId === record.externalStampRecordId) }));
}

export type MomentMediaInput = { storageKey: string; mediaUrl: string; mimeType: string; caption?: string | null };
export type MomentCreateInput = { title: string; note: string; occurredAt: Date; locationLabel?: string | null; mood?: string | null; visibility: "private" | "shared_link"; isFavorite: boolean; tags: string[]; media: MomentMediaInput[] };
export type MomentUpdateInput = Partial<Omit<MomentCreateInput, "media">>;
export type IdentificationScanInput = { topCandidateSlug?: string | null; candidateSlugs: string[]; status: "reviewed" | "needs_research" | "dismissed"; note?: string | null; aiAnalysisJson?: string | null; model?: string | null };

export async function listIdentificationScans(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(identificationScans).where(eq(identificationScans.userId, userId)).orderBy(desc(identificationScans.createdAt)).limit(100);
}
export async function createIdentificationScan(userId: number, input: IdentificationScanInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(identificationScans).values({ userId, topCandidateSlug: input.topCandidateSlug ?? null, candidateSlugs: JSON.stringify(Array.from(new Set(input.candidateSlugs)).slice(0, 12)), status: input.status, note: input.note ?? null, aiAnalysisJson: input.aiAnalysisJson ?? null, model: input.model ?? null });
  return listIdentificationScans(userId);
}
export async function updateIdentificationScan(userId: number, id: number, patch: Partial<Pick<IdentificationScanInput, "status" | "note">>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(identificationScans).set(patch).where(and(eq(identificationScans.id, id), eq(identificationScans.userId, userId)));
  return listIdentificationScans(userId);
}
export async function deleteIdentificationScan(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(identificationScans).where(and(eq(identificationScans.id, id), eq(identificationScans.userId, userId)));
  return listIdentificationScans(userId);
}

export async function listMoments(userId: number, filters?: { favoriteOnly?: boolean; tagId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(moments.userId, userId), filters?.favoriteOnly ? eq(moments.isFavorite, true) : undefined].filter(Boolean);
  const rows = await db.select().from(moments).where(and(...conditions)).orderBy(desc(moments.occurredAt));
  if (!rows.length) return [];
  const momentIds = rows.map((row) => row.id);
  const media = await db.select().from(momentMedia).where(inArray(momentMedia.momentId, momentIds));
  const assignments = await db.select().from(momentTagAssignments).where(inArray(momentTagAssignments.momentId, momentIds));
  const tagIds = Array.from(new Set(assignments.map((assignment) => assignment.tagId)));
  const tags = tagIds.length ? await db.select().from(momentTags).where(inArray(momentTags.id, tagIds)) : [];
  return rows.filter((row) => !filters?.tagId || assignments.some((assignment) => assignment.momentId === row.id && assignment.tagId === filters.tagId)).map((row) => ({ ...row, media: media.filter((item) => item.momentId === row.id).sort((a, b) => a.position - b.position), tags: assignments.filter((assignment) => assignment.momentId === row.id).map((assignment) => tags.find((tag) => tag.id === assignment.tagId)).filter(Boolean) }));
}

export async function createMoment(userId: number, input: MomentCreateInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const shareToken = input.visibility === "shared_link" ? crypto.randomUUID().replaceAll("-", "") : null;
  const inserted = await db.insert(moments).values({ userId, title: input.title, note: input.note, occurredAt: input.occurredAt, locationLabel: input.locationLabel ?? null, mood: input.mood ?? null, visibility: input.visibility, isFavorite: input.isFavorite, shareToken });
  const momentId = Number(inserted[0].insertId);
  for (let position = 0; position < input.media.length; position += 1) {
    const media = input.media[position];
    await db.insert(momentMedia).values({ momentId, storageKey: media.storageKey, mediaUrl: media.mediaUrl, mimeType: media.mimeType, caption: media.caption ?? null, position });
  }
  for (const rawTag of Array.from(new Set(input.tags.map((tag) => tag.trim()).filter(Boolean)))) {
    await db.insert(momentTags).values({ userId, name: rawTag }).onDuplicateKeyUpdate({ set: { name: rawTag } });
    const tag = await db.select({ id: momentTags.id }).from(momentTags).where(and(eq(momentTags.userId, userId), eq(momentTags.name, rawTag))).limit(1);
    if (tag[0]) await db.insert(momentTagAssignments).values({ momentId, tagId: tag[0].id }).onDuplicateKeyUpdate({ set: { tagId: tag[0].id } });
  }
  const created = await listMoments(userId);
  return created.find((moment) => moment.id === momentId) ?? null;
}

export async function updateMoment(userId: number, momentId: number, input: MomentUpdateInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select().from(moments).where(and(eq(moments.id, momentId), eq(moments.userId, userId))).limit(1);
  if (!existing[0]) throw new Error("Moment unavailable");
  const nextVisibility = input.visibility ?? existing[0].visibility;
  const nextShareToken = nextVisibility === "shared_link" ? existing[0].shareToken ?? crypto.randomUUID().replaceAll("-", "") : null;
  await db.update(moments).set({ title: input.title ?? existing[0].title, note: input.note ?? existing[0].note, occurredAt: input.occurredAt ?? existing[0].occurredAt, locationLabel: input.locationLabel === undefined ? existing[0].locationLabel : input.locationLabel, mood: input.mood === undefined ? existing[0].mood : input.mood, visibility: nextVisibility, isFavorite: input.isFavorite ?? existing[0].isFavorite, shareToken: nextShareToken, updatedAt: new Date() }).where(eq(moments.id, momentId));
  if (input.tags) {
    await db.delete(momentTagAssignments).where(eq(momentTagAssignments.momentId, momentId));
    for (const rawTag of Array.from(new Set(input.tags.map((tag) => tag.trim()).filter(Boolean)))) {
      await db.insert(momentTags).values({ userId, name: rawTag }).onDuplicateKeyUpdate({ set: { name: rawTag } });
      const tag = await db.select({ id: momentTags.id }).from(momentTags).where(and(eq(momentTags.userId, userId), eq(momentTags.name, rawTag))).limit(1);
      if (tag[0]) await db.insert(momentTagAssignments).values({ momentId, tagId: tag[0].id });
    }
  }
  const updated = await listMoments(userId);
  return updated.find((moment) => moment.id === momentId) ?? null;
}

export async function toggleMomentFavorite(userId: number, momentId: number, isFavorite: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(moments).set({ isFavorite, updatedAt: new Date() }).where(and(eq(moments.id, momentId), eq(moments.userId, userId)));
  return { id: momentId, isFavorite };
}

export async function deleteMoment(userId: number, momentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(moments).where(and(eq(moments.id, momentId), eq(moments.userId, userId)));
  return { id: momentId };
}

export async function listMomentTags(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(momentTags).where(eq(momentTags.userId, userId)).orderBy(momentTags.name);
}

export async function listMomentCollections(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const collections = await db.select().from(momentCollections).where(eq(momentCollections.userId, userId)).orderBy(desc(momentCollections.updatedAt));
  if (!collections.length) return [];
  const items = await db.select().from(momentCollectionItems).where(inArray(momentCollectionItems.momentCollectionId, collections.map((collection) => collection.id)));
  return collections.map((collection) => { const collectionItems = items.filter((item) => item.momentCollectionId === collection.id).sort((a, b) => a.position - b.position); return { ...collection, momentCount: collectionItems.length, momentIds: collectionItems.map((item) => item.momentId) }; });
}

export async function createMomentCollection(userId: number, input: { title: string; description: string; coverMediaUrl?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const created = await db.insert(momentCollections).values({ userId, title: input.title, description: input.description, coverMediaUrl: input.coverMediaUrl ?? null });
  return { id: Number(created[0].insertId), title: input.title };
}

export async function assignMomentToCollection(userId: number, momentCollectionId: number, momentId: number, position: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const ownedCollection = await db.select({ id: momentCollections.id }).from(momentCollections).where(and(eq(momentCollections.id, momentCollectionId), eq(momentCollections.userId, userId))).limit(1);
  const ownedMoment = await db.select({ id: moments.id }).from(moments).where(and(eq(moments.id, momentId), eq(moments.userId, userId))).limit(1);
  if (!ownedCollection[0] || !ownedMoment[0]) throw new Error("Moment or collection unavailable");
  await db.insert(momentCollectionItems).values({ momentCollectionId, momentId, position }).onDuplicateKeyUpdate({ set: { position } });
  return { momentCollectionId, momentId, position };
}

export async function replaceMomentCollectionItems(userId: number, momentCollectionId: number, momentIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const ownedCollection = await db.select({ id: momentCollections.id }).from(momentCollections).where(and(eq(momentCollections.id, momentCollectionId), eq(momentCollections.userId, userId))).limit(1);
  if (!ownedCollection[0]) throw new Error("Collection unavailable");
  if (momentIds.length) {
    const ownedMoments = await db.select({ id: moments.id }).from(moments).where(and(eq(moments.userId, userId), inArray(moments.id, momentIds)));
    if (ownedMoments.length !== momentIds.length) throw new Error("One or more moments are unavailable");
  }
  await db.delete(momentCollectionItems).where(eq(momentCollectionItems.momentCollectionId, momentCollectionId));
  for (let position = 0; position < momentIds.length; position += 1) await db.insert(momentCollectionItems).values({ momentCollectionId, momentId: momentIds[position], position });
  return { momentCollectionId, momentIds };
}
