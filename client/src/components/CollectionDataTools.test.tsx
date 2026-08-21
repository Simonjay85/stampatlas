// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mutateAsync = vi.fn();
const backupRefetch = vi.fn();
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ collection: { list: { invalidate: vi.fn() } }, albums: { list: { invalidate: vi.fn() } } }), collection: { importCsv: { useMutation: () => ({ mutateAsync, isPending: false, data: null }) }, backup: { useQuery: () => ({ refetch: backupRefetch, isFetching: false }) } } } }));
import { CollectionDataTools } from "./CollectionDataTools";

describe("CollectionDataTools", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); mutateAsync.mockReset(); backupRefetch.mockReset(); });
  it("shows import failure feedback and retries the validated CSV rows", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true); mutateAsync.mockRejectedValue(new Error("offline"));
    render(<CollectionDataTools />); const user = userEvent.setup();
    await user.upload(screen.getByLabelText(/choose csv/i), new File(["Stamp slug,Condition\nretry-stamp,Mint"], "retry.csv", { type: "text/csv" }));
    await screen.findByText(/1 row\(s\) are ready to import/i);
    await user.click(screen.getByRole("button", { name: /import validated rows/i }));
    expect(await screen.findByText(/import did not complete/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /retry import/i }));
    expect(mutateAsync).toHaveBeenCalledTimes(2);
  });
  it("shows backup error feedback and retries the JSON backup action", async () => {
    backupRefetch.mockRejectedValue(new Error("offline")); render(<CollectionDataTools />); const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /download json backup/i }));
    expect(await screen.findByText(/backup could not be prepared/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /retry backup/i }));
    expect(backupRefetch).toHaveBeenCalledTimes(2);
  });
  it("confirms successful JSON backup after creating the download", async () => {
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:test") }); Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() }); vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    backupRefetch.mockResolvedValue({ data: { items: [], albums: [], assignments: [] } }); render(<CollectionDataTools />);
    await userEvent.setup().click(screen.getByRole("button", { name: /download json backup/i }));
    expect(await screen.findByText(/json backup downloaded successfully/i)).toBeTruthy();
  });
});
