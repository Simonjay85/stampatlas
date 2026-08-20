import { describe, expect, it } from "vitest";
import { filterStamps, getPublicAlbum, getPublicProfile, stamps } from "./catalog";

describe("stamp catalogue seed", () => {
  it("contains at least 40 mock records across the requested country and decade coverage", () => {
    expect(stamps).toHaveLength(40);
    expect(new Set(stamps.map((stamp) => stamp.country)).size).toBeGreaterThanOrEqual(8);
    expect(new Set(stamps.map((stamp) => stamp.decade)).size).toBeGreaterThanOrEqual(5);
    expect(stamps.every((stamp) => stamp.isSeededMock)).toBe(true);
  });

  it("filters catalogue records by text, country, era, topic, and condition", () => {
    const results = filterStamps({
      query: "flag",
      country: "United States",
      decade: "1960s",
      topic: "Patriotic",
      condition: "Mint",
    });
    expect(results.map((stamp) => stamp.slug)).toEqual(["flag-over-capitol"]);
  });

  it("filters catalogue records by provenance source", () => {
    const results = filterStamps({ source: "Wikimedia Commons", country: "United States" });
    expect(results).toHaveLength(5);
    expect(results.every((stamp) => stamp.provenance.provider === "Wikimedia Commons")).toBe(true);
  });

  it("resolves seeded public profile and album data by shareable URL fragments", () => {
    expect(getPublicProfile("elena")?.albums).toHaveLength(2);
    expect(getPublicAlbum("elena", "modern-icons")?.stampSlugs).toContain("flag-over-capitol");
    expect(getPublicAlbum("unknown", "modern-icons")).toBeUndefined();
  });

  it("provides provider, rights, attribution, and publish status for featured-card provenance detail", () => {
    const featured = stamps.slice(0, 4);
    expect(featured.every((stamp) => stamp.provenance.provider && stamp.provenance.rightsLabel && stamp.provenance.attribution && stamp.provenance.publishStatus)).toBe(true);
  });
});
