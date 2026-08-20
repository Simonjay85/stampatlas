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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CollectionItem = typeof collectionItems.$inferSelect;
export type Album = typeof albums.$inferSelect;
