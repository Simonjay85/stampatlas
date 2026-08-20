import { describe, expect, it } from "vitest";
import { normalizeExternalStamp } from "./normalizedCatalogue";

describe("normalizeExternalStamp", () => {
  it("keeps source rights and leaves unavailable metadata explicit", () => {
    const stamp = normalizeExternalStamp({ id: 42, externalStampRecordId: 9, slug: "historic-post-9", provider: "wikimedia_commons", canonicalUrl: "https://commons.wikimedia.org/wiki/File:Historic_post", title: "Historic Post", country: "Exampleland", issueDate: "1956", denomination: null, description: null, rightsLabel: "CC BY 4.0", attribution: "Example creator", assets: [{ mediaUrl: "https://example.org/full.jpg", previewUrl: null, creator: "Example creator", attribution: "Example creator", rightsLabel: "CC BY 4.0" }] });
    expect(stamp).toMatchObject({ origin: "external", slug: "historic-post-9", country: "Exampleland", year: 1956, decade: "1950s", denomination: null, color: null, provenance: { provider: "Wikimedia Commons", rightsLabel: "CC BY 4.0", attribution: "Example creator", publishStatus: "Approved import" } });
    expect(stamp.image).toBe("https://example.org/full.jpg");
    expect(stamp.distinguishingFeatures).toContain("Source issue date: 1956");
  });
});
