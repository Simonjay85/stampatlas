import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ImportReviewCard } from "./ImportReviewCard";

describe("ImportReviewCard", () => {
  it("renders review actions and dark-mode contrast classes for a rights-cleared import", () => {
    const markup = renderToStaticMarkup(<ImportReviewCard record={{ id: 1, provider: "wikimedia_commons", title: "1913 Turkish postage stamp", country: "Turkey", normalizedCountry: "Turkey", eraDecade: "1910s", classificationConfidence: 96, reuseStatus: "public_domain", reviewStatus: "approved", attribution: "Unknown author", canonicalUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg", assets: [{ previewUrl: "https://upload.wikimedia.org/example.jpg" }] }} reviewing={false} publishing={false} onReview={vi.fn()} onPublish={vi.fn()} />);
    expect(markup).toContain("Approve");
    expect(markup).toContain("Reject");
    expect(markup).toContain("Publish");
    expect(markup).toContain("dark:text-[#f0f5ef]");
    expect(markup).toContain("dark:text-[#dff0e3]");
  });
});
