import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "user" | "reviewer" | "admin"): TrpcContext {
  return { user: { id: role === "admin" ? 1 : role === "reviewer" ? 2 : 7, openId: `${role}-user`, name: `${role} user`, email: `${role}@example.com`, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("external import administration", () => {
  it("rejects a standard user before any imported records can be listed", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.externalImports.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows a reviewer to access review tools but blocks administrator-only actions", async () => {
    const caller = appRouter.createCaller(context("reviewer"));
    await expect(caller.externalImports.list()).resolves.toBeInstanceOf(Array);
    await expect(caller.externalImports.publish({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.externalImports.stage({ provider: "wikimedia_commons", query: "test", records: [] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.externalImports.stageSmithsonianFile({ fileName: "open-access.json", fileText: "[{\"id\":\"test\",\"title\":\"Test stamp\"}]", sourceUrl: "https://www.si.edu/openaccess", confirmedRightsReview: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.accessControl.listUsers()).rejects.toMatchObject({ code: "FORBIDDEN" });
  }, 15_000);

  it("keeps role management available only to an administrator", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await expect(caller.accessControl.listUsers()).resolves.toBeInstanceOf(Array);
  });
});
