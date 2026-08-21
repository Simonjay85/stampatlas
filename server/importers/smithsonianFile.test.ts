import { describe, expect, it } from "vitest";
import { parseSmithsonianOpenAccessFile } from "./smithsonianFile";

describe("Smithsonian Open Access file intake", () => {
  it("maps a bounded JSON manifest while retaining provenance and avoiding source prose", () => {
    const records = parseSmithsonianOpenAccessFile(JSON.stringify({ records: [{ id: "sa-123", title: "Example postage stamp", country: "Exampleland", date: "1954", rights: "CC0", reuseStatus: "public_domain", rightsUrl: "https://www.si.edu/openaccess", media: [{ url: "https://ids.si.edu/example.jpg", thumbnailUrl: "https://ids.si.edu/thumb.jpg" }], notes: "Source prose that must not be copied" }] }));
    expect(records[0]).toMatchObject({ sourceRecordId: "sa-123", canonicalUrl: "https://www.si.edu/object/sa-123", description: null, reuseStatus: "public_domain", assets: [{ mediaUrl: "https://ids.si.edu/example.jpg", reuseStatus: "needs_review" }] });
  });

  it("rejects invalid JSON and oversized batches while dropping unsafe media URLs", () => {
    expect(() => parseSmithsonianOpenAccessFile("not-json")).toThrow("not valid JSON");
    expect(parseSmithsonianOpenAccessFile(JSON.stringify([{ id: "unsafe", title: "Unsafe", media: [{ url: "http://example.com/stamp.jpg" }] }]))[0].assets).toEqual([]);
    expect(() => parseSmithsonianOpenAccessFile(JSON.stringify(Array.from({ length: 101 }, (_, index) => ({ id: String(index), title: "Stamp" }))))).toThrow("between 1 and 100");
  });
});
