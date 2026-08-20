import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function authenticatedContext(): TrpcContext {
  return { user: { id: 1, openId: "stampatlas-persistence-test-user", email: "collector@example.com", name: "Collection Tester", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("private identification scan history", () => {
  it("persists candidate slugs and permits the owner to update then delete the scan", async () => {
    const caller = appRouter.createCaller(authenticatedContext());
    const created = await caller.identification.create({ topCandidateSlug: "test-candidate", candidateSlugs: ["test-candidate", "alternate-candidate"], status: "needs_research", note: "Initial research" });
    const scan = created.find((item) => item.topCandidateSlug === "test-candidate");
    expect(scan).toMatchObject({ status: "needs_research", note: "Initial research" });
    const updated = await caller.identification.update({ id: scan!.id, status: "reviewed", note: "Compared perforations" });
    expect(updated.find((item) => item.id === scan!.id)).toMatchObject({ status: "reviewed", note: "Compared perforations" });
    const remaining = await caller.identification.remove({ id: scan!.id });
    expect(remaining.some((item) => item.id === scan!.id)).toBe(false);
  }, 15_000);
});
