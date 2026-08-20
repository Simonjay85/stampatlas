// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImportReviewCard, metadataSaveFeedback } from "./ImportReviewCard";

const record = { id: 1, provider: "wikimedia_commons", title: "1913 Turkish postage stamp", country: "Turkey", normalizedCountry: "Turkey", eraDecade: "1910s", classificationConfidence: 96, reuseStatus: "public_domain", reviewStatus: "approved", attribution: "Unknown author", canonicalUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg", assets: [{ previewUrl: "https://upload.wikimedia.org/example.jpg" }] };

function renderCard(onSaveMetadata: (metadata: { country: string | null; eraDecade: string | null }) => Promise<unknown>) {
  return render(<ImportReviewCard record={record} reviewing={false} publishing={false} onReview={vi.fn()} onPublish={vi.fn()} onSaveMetadata={onSaveMetadata} />);
}

describe("ImportReviewCard", () => {
  afterEach(() => cleanup());

  it("renders review actions and dark-mode contrast classes for a rights-cleared import", () => {
    const markup = renderToStaticMarkup(<ImportReviewCard record={record} reviewing={false} publishing={false} onReview={vi.fn()} onPublish={vi.fn()} onSaveMetadata={async () => undefined} />);
    expect(markup).toContain("Approve");
    expect(markup).toContain("Reject");
    expect(markup).toContain("Publish");
    expect(markup).toContain("Edit country &amp; era");
    expect(markup).toContain("dark:text-[#f0f5ef]");
    expect(markup).toContain("dark:text-[#dff0e3]");
  });

  it("provides distinct saving, success, and error feedback for metadata mutations", () => {
    expect(metadataSaveFeedback("saving")?.text).toContain("Saving");
    expect(metadataSaveFeedback("success")?.text).toContain("Metadata saved");
    expect(metadataSaveFeedback("error")?.text).toContain("Could not save");
  });

  it("keeps the editor open and confirms success after a resolved metadata callback", async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue(undefined);
    renderCard(save);
    await user.click(screen.getByRole("button", { name: /edit country/i }));
    await user.clear(screen.getByLabelText("Country"));
    await user.type(screen.getByLabelText("Country"), "Türkiye");
    await user.click(screen.getByRole("button", { name: /^Save metadata$/ }));
    expect(save).toHaveBeenCalledWith({ country: "Türkiye", eraDecade: "1910s" });
    expect(await screen.findByText(/Metadata saved/)).toBeTruthy();
    expect(screen.getByLabelText("Country")).toBeTruthy();
  });

  it("keeps the editor open and reports an error after a rejected metadata callback", async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockRejectedValue(new Error("network unavailable"));
    renderCard(save);
    await user.click(screen.getByRole("button", { name: /edit country/i }));
    await user.click(screen.getByRole("button", { name: /^Save metadata$/ }));
    expect((await screen.findByRole("alert")).textContent).toContain("Could not save metadata");
    expect(screen.getByLabelText("Country")).toBeTruthy();
  });
});
