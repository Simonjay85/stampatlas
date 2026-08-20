import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("collection authorization", () => {
  it("rejects unauthenticated access to personal collection records", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.collection.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
