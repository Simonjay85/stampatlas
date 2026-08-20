import { date, decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const collectionItems = mysqlTable("collectionItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  stampSlug: varchar("stampSlug", { length: 160 }).notNull(),
  condition: mysqlEnum("condition", ["Mint", "Fine used", "Used", "FDC"]).notNull().default("Mint"),
  purchasePrice: decimal("purchasePrice", { precision: 10, scale: 2 }).notNull().default("0"),
  acquiredAt: date("acquiredAt").notNull(),
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
  issueDate: varchar("issueDate", { length: 64 }),
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
  sourcePayload: text("sourcePayload").notNull(),
  sourceRetrievedAt: timestamp("sourceRetrievedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("external_record_provider_source_unique").on(table.provider, table.sourceRecordId), index("external_record_review_idx").on(table.reviewStatus, table.provider)]);

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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CollectionItem = typeof collectionItems.$inferSelect;
export type Album = typeof albums.$inferSelect;
export type ExternalImportJob = typeof externalImportJobs.$inferSelect;
export type ExternalStampRecord = typeof externalStampRecords.$inferSelect;
export type ExternalStampAsset = typeof externalStampAssets.$inferSelect;
export type PublishedExternalStamp = typeof publishedExternalStamps.$inferSelect;
