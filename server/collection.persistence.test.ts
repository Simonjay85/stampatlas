import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function authenticatedContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "stampatlas-persistence-test-user",
      email: "collector@example.com",
      name: "Collection Tester",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("persistent collection data", () => {
  it("returns the authenticated user’s seeded collection and album records", async () => {
    const caller = appRouter.createCaller(authenticatedContext());
    const items = await caller.collection.list();
    const albumData = await caller.albums.list();

    expect(items.length).toBeGreaterThanOrEqual(6);
    expect(albumData.albums.length).toBeGreaterThanOrEqual(2);
    expect(albumData.assignments.length).toBeGreaterThanOrEqual(5);
  }, 15_000);
});
