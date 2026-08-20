import { boolean, date, decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "reviewer", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const collectorProfiles = mysqlTable("collectorProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  username: varchar("username", { length: 48 }).notNull().unique(),
  displayName: varchar("displayName", { length: 120 }).notNull(),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  isPublic: boolean("isPublic").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("collector_profile_public_idx").on(table.isPublic, table.username)]);

export const collectionItems = mysqlTable("collectionItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  stampSlug: varchar("stampSlug", { length: 160 }).notNull(),
  condition: mysqlEnum("condition", ["Mint", "Fine used", "Used", "FDC"]).notNull().default("Mint"),
  quantity: int("quantity").notNull().default(1),
  collectionStatus: mysqlEnum("collectionStatus", ["owned", "wishlist", "duplicate", "swap"]).notNull().default("owned"),
  grade: mysqlEnum("grade", ["superb", "very_fine", "fine", "average", "damaged", "ungraded"]).notNull().default("ungraded"),
  purchasePrice: decimal("purchasePrice", { precision: 10, scale: 2 }).notNull().default("0"),
  acquiredAt: date("acquiredAt").notNull(),
  acquisitionSource: varchar("acquisitionSource", { length: 255 }),
  storageLocation: varchar("storageLocation", { length: 255 }),
  albumPage: int("albumPage"),
  customTags: text("customTags"),
  frontImageUrl: text("frontImageUrl"),
  backImageUrl: text("backImageUrl"),
  notes: text("notes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("collection_user_created_idx").on(table.userId, table.createdAt)]);

export const albums = mysqlTable("albums", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description").notNull(),
  coverStampSlug: varchar("coverStampSlug", { length: 160 }).notNull(),
  visibility: mysqlEnum("visibility", ["private", "public"]).notNull().default("private"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("albums_user_updated_idx").on(table.userId, table.updatedAt)]);

export const albumItems = mysqlTable("albumItems", {
  id: int("id").autoincrement().primaryKey(),
  albumId: int("albumId").notNull().references(() => albums.id, { onDelete: "cascade" }),
  collectionItemId: int("collectionItemId").notNull().references(() => collectionItems.id, { onDelete: "cascade" }),
  position: int("position").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("album_item_unique").on(table.albumId, table.collectionItemId), index("album_position_idx").on(table.albumId, table.position)]);

export const externalImportJobs = mysqlTable("externalImportJobs", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 64 }).notNull(),
  query: varchar("query", { length: 500 }).notNull(),
  status: mysqlEnum("status", ["queued", "completed", "failed"]).notNull().default("queued"),
  requestedByUserId: int("requestedByUserId").references(() => users.id, { onDelete: "set null" }),
  receivedCount: int("receivedCount").notNull().default(0),
  stagedCount: int("stagedCount").notNull().default(0),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => [index("external_jobs_provider_started_idx").on(table.provider, table.startedAt)]);

export const externalStampRecords = mysqlTable("externalStampRecords", {
  id: int("id").autoincrement().primaryKey(),
  importJobId: int("importJobId").references(() => externalImportJobs.id, { onDelete: "set null" }),
  provider: varchar("provider", { length: 64 }).notNull(),
  sourceRecordId: varchar("sourceRecordId", { length: 255 }).notNull(),
  canonicalUrl: text("canonicalUrl").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  country: varchar("country", { length: 160 }),
  normalizedCountry: varchar("normalizedCountry", { length: 160 }),
  issueDate: varchar("issueDate", { length: 64 }),
  eraDecade: varchar("eraDecade", { length: 16 }),
  classificationMethod: mysqlEnum("classificationMethod", ["source_metadata", "heuristic", "manual_override", "unclassified"]).notNull().default("unclassified"),
  classificationConfidence: int("classificationConfidence").notNull().default(0),
  denomination: varchar("denomination", { length: 80 }),
  description: text("description"),
  reuseStatus: mysqlEnum("reuseStatus", ["public_domain", "cc_by", "permission_granted", "metadata_only", "needs_review", "blocked"]).notNull().default("needs_review"),
  rightsLabel: varchar("rightsLabel", { length: 255 }),
  rightsUrl: text("rightsUrl"),
  attribution: text("attribution"),
  reviewStatus: mysqlEnum("reviewStatus", ["pending", "approved", "rejected"]).notNull().default("pending"),
  reviewNote: text("reviewNote"),
  reviewedByUserId: int("reviewedByUserId").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewedAt"),
  lastUpdatedByUserId: int("lastUpdatedByUserId").references(() => users.id, { onDelete: "set null" }),
  sourcePayload: text("sourcePayload").notNull(),
  sourceRetrievedAt: timestamp("sourceRetrievedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("external_record_provider_source_unique").on(table.provider, table.sourceRecordId), index("external_record_review_idx").on(table.reviewStatus, table.provider), index("external_record_last_updated_idx").on(table.lastUpdatedByUserId, table.updatedAt)]);

export const externalStampMetadataHistory = mysqlTable("externalStampMetadataHistory", {
  id: int("id").autoincrement().primaryKey(),
  externalStampRecordId: int("externalStampRecordId").notNull().references(() => externalStampRecords.id, { onDelete: "cascade" }),
  changedByUserId: int("changedByUserId").references(() => users.id, { onDelete: "set null" }),
  previousCountry: varchar("previousCountry", { length: 160 }),
  nextCountry: varchar("nextCountry", { length: 160 }),
  previousEraDecade: varchar("previousEraDecade", { length: 16 }),
  nextEraDecade: varchar("nextEraDecade", { length: 16 }),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
}, (table) => [index("metadata_history_record_changed_idx").on(table.externalStampRecordId, table.changedAt)]);

export const moments = mysqlTable("moments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 160 }).notNull(),
  note: text("note").notNull(),
  occurredAt: timestamp("occurredAt").notNull(),
  locationLabel: varchar("locationLabel", { length: 255 }),
  mood: varchar("mood", { length: 40 }),
  visibility: mysqlEnum("visibility", ["private", "shared_link"]).notNull().default("private"),
  isFavorite: boolean("isFavorite").notNull().default(false),
  shareToken: varchar("shareToken", { length: 64 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("moments_user_occurred_idx").on(table.userId, table.occurredAt), index("moments_user_updated_idx").on(table.userId, table.updatedAt)]);

export const momentMedia = mysqlTable("momentMedia", {
  id: int("id").autoincrement().primaryKey(),
  momentId: int("momentId").notNull().references(() => moments.id, { onDelete: "cascade" }),
  storageKey: varchar("storageKey", { length: 500 }).notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  caption: varchar("caption", { length: 280 }),
  position: int("position").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("moment_media_moment_position_idx").on(table.momentId, table.position)]);

export const momentTags = mysqlTable("momentTags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 60 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("moment_tag_user_name_unique").on(table.userId, table.name)]);

export const momentTagAssignments = mysqlTable("momentTagAssignments", {
  id: int("id").autoincrement().primaryKey(),
  momentId: int("momentId").notNull().references(() => moments.id, { onDelete: "cascade" }),
  tagId: int("tagId").notNull().references(() => momentTags.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("moment_tag_assignment_unique").on(table.momentId, table.tagId)]);

export const momentCollections = mysqlTable("momentCollections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description").notNull(),
  coverMediaUrl: text("coverMediaUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("moment_collections_user_updated_idx").on(table.userId, table.updatedAt)]);

export const momentCollectionItems = mysqlTable("momentCollectionItems", {
  id: int("id").autoincrement().primaryKey(),
  momentCollectionId: int("momentCollectionId").notNull().references(() => momentCollections.id, { onDelete: "cascade" }),
  momentId: int("momentId").notNull().references(() => moments.id, { onDelete: "cascade" }),
  position: int("position").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("moment_collection_item_unique").on(table.momentCollectionId, table.momentId), index("moment_collection_position_idx").on(table.momentCollectionId, table.position)]);

export const externalStampAssets = mysqlTable("externalStampAssets", {
  id: int("id").autoincrement().primaryKey(),
  externalStampRecordId: int("externalStampRecordId").notNull().references(() => externalStampRecords.id, { onDelete: "cascade" }),
  providerAssetId: varchar("providerAssetId", { length: 255 }).notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  previewUrl: text("previewUrl"),
  mimeType: varchar("mimeType", { length: 120 }),
  creator: text("creator"),
  attribution: text("attribution"),
  rightsLabel: varchar("rightsLabel", { length: 255 }),
  rightsUrl: text("rightsUrl"),
  reuseStatus: mysqlEnum("reuseStatus", ["public_domain", "cc_by", "permission_granted", "metadata_only", "needs_review", "blocked"]).notNull().default("needs_review"),
  sourceRetrievedAt: timestamp("sourceRetrievedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("external_asset_record_provider_unique").on(table.externalStampRecordId, table.providerAssetId)]);

export const publishedExternalStamps = mysqlTable("publishedExternalStamps", {
  id: int("id").autoincrement().primaryKey(),
  externalStampRecordId: int("externalStampRecordId").notNull().references(() => externalStampRecords.id, { onDelete: "cascade" }).unique(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  publishedByUserId: int("publishedByUserId").references(() => users.id, { onDelete: "set null" }),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("published_external_published_idx").on(table.publishedAt)]);
export const identificationScans = mysqlTable("identificationScans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  topCandidateSlug: varchar("topCandidateSlug", { length: 160 }),
  candidateSlugs: text("candidateSlugs").notNull(),
  aiAnalysisJson: text("aiAnalysisJson"),
  model: varchar("model", { length: 120 }),
  status: mysqlEnum("status", ["reviewed", "needs_research", "dismissed"]).notNull().default("needs_research"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("identification_scan_user_idx").on(table.userId, table.createdAt)]);
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CollectionItem = typeof collectionItems.$inferSelect;
export type Album = typeof albums.$inferSelect;
export type ExternalImportJob = typeof externalImportJobs.$inferSelect;
export type ExternalStampRecord = typeof externalStampRecords.$inferSelect;
export type ExternalStampAsset = typeof externalStampAssets.$inferSelect;
export type ExternalStampMetadataHistory = typeof externalStampMetadataHistory.$inferSelect;
export type PublishedExternalStamp = typeof publishedExternalStamps.$inferSelect;
export type Moment = typeof moments.$inferSelect;
export type MomentMedia = typeof momentMedia.$inferSelect;
export type MomentTag = typeof momentTags.$inferSelect;
export type MomentCollection = typeof momentCollections.$inferSelect;
export type IdentificationScan = typeof identificationScans.$inferSelect;
