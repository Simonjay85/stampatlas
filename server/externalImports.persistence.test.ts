import { and, eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { externalImportJobs, externalStampRecords, publishedExternalStamps } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const sourceRecordId = `pipeline-test-${Date.now()}`;
function adminContext(): TrpcContext {
  return { user: { id: 1, openId: "stampatlas-admin-test", email: "admin@example.com", name: "Pipeline Admin", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

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

describe("external import persistence pipeline", () => {
  it("stages a rights-cleared record, retains its asset, approves it, and publishes it to the public catalogue", async () => {
    const caller = appRouter.createCaller(adminContext());
    const staged = await caller.externalImports.stage({ provider: "wikimedia_commons", query: "test postage stamp", records: [{ sourceRecordId, canonicalUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg", title: "Pipeline Test Stamp", country: "Exampleland", issueDate: "1950", denomination: "3c", description: "Integration-test record", reuseStatus: "public_domain", rightsLabel: "Public domain", rightsUrl: "https://creativecommons.org/publicdomain/mark/1.0/", attribution: "Test attribution", sourcePayload: JSON.stringify({ sourceRecordId }), assets: [{ providerAssetId: `${sourceRecordId}:asset`, mediaUrl: "https://upload.wikimedia.org/example.jpg", previewUrl: "https://upload.wikimedia.org/example-thumb.jpg", mimeType: "image/jpeg", creator: "Test creator", attribution: "Test attribution", rightsLabel: "Public domain", rightsUrl: "https://creativecommons.org/publicdomain/mark/1.0/", reuseStatus: "public_domain" }] }] });
    expect(staged.stagedCount).toBe(1);
    const pending = await caller.externalImports.list({ reviewStatus: "pending" });
    const record = pending.find((candidate) => candidate.sourceRecordId === sourceRecordId);
    expect(record?.id).toBeTruthy();
    const pendingSummary = await caller.externalImports.pendingSummary();
    expect(pendingSummary.count).toBeGreaterThan(0);
    const updated = await caller.externalImports.updateMetadata({ id: record!.id, country: "Editorial Turkey", eraDecade: "1910s" });
    expect(updated.normalizedCountry).toBe("Editorial Turkey");
    expect(updated.eraDecade).toBe("1910s");
    expect(updated.classificationMethod).toBe("manual_override");
    const history = await caller.externalImports.history({ id: record!.id });
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ previousCountry: "Exampleland", nextCountry: "Editorial Turkey", previousEraDecade: "1950s", nextEraDecade: "1910s" });
    await caller.externalImports.review({ id: record!.id, reviewStatus: "approved", reviewNote: "Rights checked for test." });
    const published = await caller.externalImports.publish({ id: record!.id });
    expect(published.slug).toContain("pipeline-test-stamp");
    const catalogue = await caller.externalCatalogue.list();
    const visible = catalogue.find((candidate) => candidate.sourceRecordId === sourceRecordId);
    expect(visible?.assets).toHaveLength(1);
    expect(visible?.reuseStatus).toBe("public_domain");
    const unified = await caller.catalogue.list({ query: "Pipeline Test Stamp", country: "Editorial Turkey", decade: "1910s" });
    expect(unified.items).toHaveLength(1);
    expect(unified.items[0]).toMatchObject({ slug: published.slug, origin: "external", provenance: { provider: "Wikimedia Commons", rightsLabel: "Public domain", publishStatus: "Approved import" } });
    expect(await caller.catalogue.bySlug({ slug: published.slug })).toMatchObject({ slug: published.slug, origin: "external" });
    expect(await caller.catalogue.bySlugs({ slugs: [published.slug, "flag-over-capitol"] })).toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: published.slug, origin: "external" }),
      expect.objectContaining({ slug: "flag-over-capitol", origin: "seeded" }),
    ]));
    const secondPage = await caller.catalogue.list({ page: 1, limit: 24 });
    expect(secondPage.items).toHaveLength(17);
    expect(secondPage.items.slice(0, 16).every((item) => item.origin === "seeded")).toBe(true);
    expect(secondPage.items[16]).toMatchObject({ slug: published.slug, origin: "external" });
    expect(secondPage.nextPage).toBeNull();
  }, 15_000);
});
