// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SharePublicLink } from "./SharePublicLink";

describe("SharePublicLink", () => {
  afterEach(() => cleanup());
  it("copies the current public URL and confirms the action", async () => {
    render(<SharePublicLink title="A public profile" text="Public albums" />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Copy public link" }));
    expect((await screen.findByLabelText("Share this public page")).textContent).toContain("Link copied");
  });
});
