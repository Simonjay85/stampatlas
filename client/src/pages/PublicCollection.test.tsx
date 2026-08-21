// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const publicQuery = vi.fn();
const publicData = { profile: { username: "privacy-tester", displayName: "Privacy Tester", bio: "Only approved albums are shared." }, albums: [{ id: 42, name: "Approved album", description: "Public only", visibility: "public" }], assignments: [{ albumId: 42, collectionItemId: 9, position: 0 }], items: [{ id: 9, stampSlug: "flag-over-capitol" }] };
vi.mock("@/components/AppShell", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/SharePublicLink", () => ({ SharePublicLink: () => <button>Share</button> }));
vi.mock("@/components/StampVisual", () => ({ StampVisual: () => <div data-testid="stamp-visual" /> }));
vi.mock("@/lib/trpc", () => ({ trpc: { profiles: { public: { useQuery: (input: unknown, options: unknown) => { publicQuery(input, options); return { data: publicData, isLoading: false }; } } } } }));
vi.mock("@/hooks/usePublicCatalogue", () => ({ useCatalogueStampsBySlugs: () => ({ loading: false, bySlug: new Map([["flag-over-capitol", { id: "flag", slug: "flag-over-capitol", title: "Capitol Flag", country: "Exampleland", year: 1950, provenance: { provider: "Seeded catalogue", publishStatus: "Seeded verified" } }]]) }) }));
vi.mock("wouter", () => ({ Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>, useRoute: (pattern: string) => pattern.includes(":collectionSlug") ? [true, { username: "privacy-tester", collectionSlug: "42" }] : [true, { username: "privacy-tester" }] }));
import PublicCollection from "./PublicCollection";

describe("PublicCollection", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });
  it("renders only the public API collection and links to its public numeric album URL", () => {
    render(<PublicCollection />);
    expect(publicQuery).toHaveBeenCalledWith({ username: "privacy-tester" }, { enabled: true });
    expect(screen.getAllByText("Approved album").length).toBeGreaterThan(1);
    expect(screen.queryByText(/Elena/i)).toBeNull();
    expect(screen.getAllByRole("link", { name: "Approved album" }).find((link) => link.getAttribute("href") === "/collections/privacy-tester/42")).toBeTruthy();
  });
});
