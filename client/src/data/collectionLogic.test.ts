import { describe, expect, it } from "vitest";
import { buildCollectionCsv, reorderIds } from "./collectionLogic";

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
});
