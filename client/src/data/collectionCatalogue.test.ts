import { describe, expect, it } from "vitest";
import { resolveCollectionCatalogueItems } from "./collectionCatalogue";
import type { NormalizedStamp } from "./normalizedCatalogue";

describe("resolveCollectionCatalogueItems", () => {
  it("keeps collection items that point to an approved external catalogue slug", () => {
    const external = { id: "external-7", slug: "approved-external", title: "Approved external", country: "Exampleland", countryCode: "--", year: 1950, decade: "1950s", topic: "Unclassified", series: null, denomination: null, color: null, image: "https://example.org/stamp.jpg", imageAlt: "Approved external", description: null, historicalContext: null, perforation: null, watermark: null, printingMethod: null, printRun: null, catalogueReference: null, condition: "Unknown", distinguishingFeatures: [], sourceCredit: null, sourceUrl: "https://example.org", provenance: { provider: "Wikimedia Commons", rightsLabel: "Public domain", attribution: null, publishStatus: "Approved import" }, origin: "external" } satisfies NormalizedStamp;
    expect(resolveCollectionCatalogueItems([{ id: "item-1", stampSlug: "approved-external" }], new Map([[external.slug, external]]))).toEqual([{ item: { id: "item-1", stampSlug: "approved-external" }, stamp: external }]);
  });
});
