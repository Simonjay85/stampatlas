import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { featuredStamps } from "@/data/catalog";
import { FeaturedStampCard } from "./FeaturedStampCard";

vi.mock("@/components/StampVisual", () => ({ StampVisual: () => <div data-testid="stamp-visual" /> }));

describe("FeaturedStampCard provenance detail", () => {
  it("renders provider, rights, attribution, and publish status in the hover detail", () => {
    const stamp = featuredStamps[0];
    const markup = renderToStaticMarkup(<FeaturedStampCard stamp={stamp} index={0} />);
    expect(markup).toContain(stamp.provenance.provider);
    expect(markup).toContain(stamp.provenance.rightsLabel);
    expect(markup).toContain(stamp.provenance.attribution);
    expect(markup).toContain(stamp.provenance.publishStatus);
    expect(markup).toContain("group-hover:opacity-100");
  });
});
