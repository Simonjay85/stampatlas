import { afterEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { externalImportJobs, externalStampRecords, publishedExternalStamps } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const sourceRecordId = `rights-guard-${Date.now()}`;
const adminContext: TrpcContext = { user: { id: 1, openId: "rights-test-admin", email: "admin@example.com", name: "Rights Test Admin", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };

afterEach(async () => {
  const db = await getDb();
  if (!db) return;
  const records = await db.select({ id: externalStampRecords.id, importJobId: externalStampRecords.importJobId }).from(externalStampRecords).where(and(eq(externalStampRecords.provider, "wikimedia_commons"), eq(externalStampRecords.sourceRecordId, sourceRecordId)));
  for (const record of records) {
    await db.delete(publishedExternalStamps).where(eq(publishedExternalStamps.externalStampRecordId, record.id));
    await db.delete(externalStampRecords).where(eq(externalStampRecords.id, record.id));
    if (record.importJobId) await db.delete(externalImportJobs).where(eq(externalImportJobs.id, record.importJobId));
  }
});

describe("external publication rights guard", () => {
  it("does not publish an approved record without a publishable reuse status", async () => {
    const caller = appRouter.createCaller(adminContext);
    await caller.externalImports.stage({ provider: "wikimedia_commons", query: "rights guard", records: [{ sourceRecordId, canonicalUrl: "https://commons.wikimedia.org/wiki/File:RightsGuard.jpg", title: "Rights Guard Stamp", reuseStatus: "needs_review", sourcePayload: JSON.stringify({ sourceRecordId }), assets: [] }] });
    const record = (await caller.externalImports.list({ reviewStatus: "pending" })).find((item) => item.sourceRecordId === sourceRecordId);
    await caller.externalImports.review({ id: record!.id, reviewStatus: "approved", reviewNote: "Metadata reviewed but no reuse clearance." });

    await expect(caller.externalImports.publish({ id: record!.id })).rejects.toThrow("The record lacks a publishable rights status");
  }, 15_000);
});
