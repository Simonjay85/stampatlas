import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("external import administration", () => {
  it("rejects a standard user before any imported records can be listed or staged", async () => {
    const ctx: TrpcContext = { user: { id: 7, openId: "standard-user", name: "Standard User", email: "user@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.externalImports.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
