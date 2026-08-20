import { describe, expect, it } from "vitest";
import { classifyImportedStamp } from "./classify";

describe("classifyImportedStamp", () => {
  it("prefers source country metadata and derives the issuing decade", () => {
    expect(classifyImportedStamp({ country: "Brasil", issueDate: "1971", title: "Rainforest Canopy", sourcePayload: "{}" })).toMatchObject({ normalizedCountry: "Brazil", eraDecade: "1970s", classificationMethod: "source_metadata", classificationConfidence: 96 });
  });

  it("uses safe heuristics when country and date are available only in the source text", () => {
    expect(classifyImportedStamp({ title: "United States postage stamp, 1963", description: "Civic issue", sourcePayload: "{}" })).toMatchObject({ normalizedCountry: "United States", eraDecade: "1960s", classificationMethod: "heuristic", classificationConfidence: 76 });
  });

  it("leaves unsupported records unclassified rather than fabricating metadata", () => {
    expect(classifyImportedStamp({ title: "Untitled collection object", sourcePayload: "{}" })).toMatchObject({ normalizedCountry: null, eraDecade: null, classificationMethod: "unclassified", classificationConfidence: 0 });
  });
});
