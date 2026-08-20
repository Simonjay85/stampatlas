import { describe, expect, it } from "vitest";
import { mockIdentificationCandidates } from "./identifyLogic";

describe("mock identifier", () => {
  it("returns three ranked visual candidates with deterministic descending confidence", () => {
    const candidates = mockIdentificationCandidates();
    expect(candidates).toHaveLength(3);
    expect(candidates.map((candidate) => candidate.confidence)).toEqual([92, 78, 71]);
    expect(candidates[0].stamp.slug).toBe("flag-over-capitol");
  });
});
