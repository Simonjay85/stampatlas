import { describe, expect, it } from "vitest";
import { buildCollectionCsv, buildPrintableCollectionReport, previewCollectionCsv, reorderIds } from "./collectionLogic";

describe("collection workflows", () => {
  it("reorders album items while retaining bounds and all item IDs", () => {
    expect(reorderIds(["one", "two", "three"], "two", -1)).toEqual(["two", "one", "three"]);
    expect(reorderIds(["one", "two", "three"], "one", -1)).toEqual(["one", "two", "three"]);
  });

  it("exports editable collection values to a quoted CSV", () => {
    const csv = buildCollectionCsv([{ title: "Flag \"Over\" Capitol", country: "United States", year: 1963, condition: "Mint", purchasePrice: 18, acquiredAt: "2026-08-12", notes: "Clean margins" }]);
    expect(csv).toContain('"Flag ""Over"" Capitol"');
    expect(csv.split("\n")).toHaveLength(2);
  });

  it("previews supported inventory columns and rejects invalid rows before import", () => {
    const preview = previewCollectionCsv('Stamp slug,Condition,Quantity,Status,Grade,Purchase price,Acquired date,Storage location,Tags,Notes\nflag-over-capitol,Mint,2,owned,very_fine,18,2026-08-12,Box A,"patriotic; 1960s","Clean example"\nmissing-condition,Bad,1,owned,ungraded,0,2026-08-12,,,');
    expect(preview.rows).toEqual([expect.objectContaining({ stampSlug: "flag-over-capitol", quantity: 2, collectionStatus: "owned", grade: "very_fine", storageLocation: "Box A", customTags: ["patriotic", "1960s"] })]);
    expect(preview.errors).toEqual([expect.objectContaining({ row: 3, message: "Invalid condition" })]);
  });

  it("builds a printable report and escapes collector supplied text", () => {
    const report = buildPrintableCollectionReport([{ title: "<script>", country: "Exampleland", year: 1950, condition: "Mint", quantity: 1, collectionStatus: "owned", grade: "ungraded", purchasePrice: 4, storageLocation: null, tags: ["test"] }]);
    expect(report).toContain("&lt;script&gt;");
    expect(report).not.toContain("<script>");
    expect(report).toContain("StampAtlas inventory report");
  });
});
