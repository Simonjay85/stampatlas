import { describe, expect, it } from "vitest";
import { addEditorialInternalLink, findSharedPhrases, validateDraftQuality } from "./editorialDraftQuality";

const body = "## A practical note\n\n" + "Collectors can record observations, compare several details, and decide which reference to consult next. ".repeat(12);

describe("editorial draft quality", () => {
  it("adds the planned internal link and accepts a bounded educational draft", () => {
    const relatedLink = "/identify";
    const linked = addEditorialInternalLink(body, relatedLink);
    expect(linked).toContain("](/identify)");
    expect(validateDraftQuality({ title: "A practical note", summary: "A clear, neutral introduction to recording observations while researching a stamp.", bodyMarkdown: linked, seoTitle: "A Practical Research Note for Stamp Collectors", seoDescription: "Learn a careful way to record observations, compare stamp details and choose the next research step without making unsupported claims.", relatedLink })).toEqual([]);
  });

  it("rejects unsupported value claims and reveals shared long phrases", () => {
    const linked = addEditorialInternalLink(`${body}\n\nThis stamp is worth $20.`, "/explore");
    expect(validateDraftQuality({ title: "Value claim", summary: "A clear, neutral introduction to recording observations while researching a stamp.", bodyMarkdown: linked, seoTitle: "A Practical Research Note for Stamp Collectors", seoDescription: "Learn a careful way to record observations, compare stamp details and choose the next research step without making unsupported claims.", relatedLink: "/explore" })).toContain("Unsupported authentication or valuation claim");
    expect(findSharedPhrases([{ slug: "first", bodyMarkdown: "one two three four five six seven eight nine ten eleven twelve thirteen" }, { slug: "second", bodyMarkdown: "zero one two three four five six seven eight nine ten eleven twelve" }])).toHaveLength(1);
  });
});
