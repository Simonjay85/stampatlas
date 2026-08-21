// @vitest-environment jsdom
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/AppShell", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/AuthGate", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/CollectionDataTools", () => ({ CollectionDataTools: () => null }));
vi.mock("@/contexts/CollectionDemoContext", () => ({ useCollectionDemo: () => ({ items: [], albums: [], isLoading: false, removeItem: vi.fn(), updateItem: vi.fn() }) }));
vi.mock("@/hooks/usePublicCatalogue", () => ({ useCatalogueStampsBySlugs: () => ({ bySlug: new Map() }) }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { name: "Collector" } }) }));
vi.mock("wouter", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));
import Dashboard from "./Dashboard";

describe("Dashboard CSV export", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });
  it("shows preparing, file creation, success, error and retry feedback", async () => {
    const frames: FrameRequestCallback[] = []; vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { frames.push(callback); return frames.length; });
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:test") }); Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() }); vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    render(<Dashboard />); const user = userEvent.setup(); await user.click(screen.getByRole("button", { name: /export current view/i }));
    expect(screen.getByRole("status").textContent).toContain("Preparing"); act(() => frames.shift()?.(0)); expect(screen.getByRole("status").textContent).toContain("Creating the CSV"); act(() => frames.shift()?.(0)); expect(screen.getByRole("status").textContent).toContain("download started");
    vi.mocked(URL.createObjectURL).mockImplementation(() => { throw new Error("blocked"); }); await user.click(screen.getByRole("button", { name: /export current view/i })); act(() => frames.shift()?.(0)); act(() => frames.shift()?.(0)); expect(screen.getByRole("button", { name: /retry export/i })).toBeTruthy(); await user.click(screen.getByRole("button", { name: /retry export/i })); expect(screen.getByRole("status").textContent).toContain("Preparing");
  });
});
