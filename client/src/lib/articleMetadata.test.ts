// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { applyArticleMetadata, isSafeMarkdownLink } from "./articleMetadata";

describe("article metadata", () => {
  afterEach(() => { document.head.innerHTML = ""; document.title = ""; });

  it("adds description, canonical and Article JSON-LD metadata", () => {
    applyArticleMetadata({ title: "A careful stamp note", description: "A neutral guide to recording what you see before continuing stamp research.", slug: "careful-stamp-note", publishedAt: "2026-08-21T00:00:00.000Z", updatedAt: "2026-08-22T00:00:00.000Z" });
    expect(document.title).toBe("A careful stamp note | StampAtlas");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toContain("neutral guide");
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toContain("/blog/careful-stamp-note");
    expect(JSON.parse(document.getElementById("stampatlas-article-jsonld")?.textContent ?? "{}")).toMatchObject({ "@type": "Article", headline: "A careful stamp note", datePublished: "2026-08-21T00:00:00.000Z" });
  });

  it("allows only local paths and HTTPS URLs for rendered Markdown links", () => {
    expect(isSafeMarkdownLink("/guides/storage-basics")).toBe(true);
    expect(isSafeMarkdownLink("https://www.example.org/research")).toBe(true);
    expect(isSafeMarkdownLink("javascript:alert(1)")).toBe(false);
    expect(isSafeMarkdownLink("http://example.org")).toBe(false);
  });
});
