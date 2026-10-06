// apps/web/tests/unit/refresh-coordinator.test.ts
import { describe, expect, it, vi } from "vitest";
import type { JWT } from "next-auth/jwt";
import { createRefreshCoordinator } from "@/lib/refresh-coordinator";

const old: JWT = { sub: "alice-id", refresh_token: "old-refresh", roles: ["admin"] };
describe("refresh coordination", () => {
  it("coalesces parallel calls and reuses the result for delayed requests", async () => {
    let time = 0;
    const coordinate = createRefreshCoordinator(15_000, 256, () => time);
    const refresh = vi.fn(async (token: JWT) => ({ ...token, refresh_token: "new-refresh" }));
    const results = await Promise.all(Array.from({ length: 12 }, () => coordinate(old, refresh)));
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(results.every((r) => r.refresh_token === "new-refresh")).toBe(true);
    time = 14_000;
    expect((await coordinate(old, refresh)).refresh_token).toBe("new-refresh");
    expect(refresh).toHaveBeenCalledTimes(1);
    time = 16_000;
    await coordinate(old, refresh);
    expect(refresh).toHaveBeenCalledTimes(2);
  });
  it("does not share results between different refresh tokens", async () => {
    const coordinate = createRefreshCoordinator();
    const refresh = vi.fn(async (token: JWT) => token);
    await Promise.all([coordinate(old, refresh), coordinate({ ...old, refresh_token: "other" }, refresh)]);
    expect(refresh).toHaveBeenCalledTimes(2);
  });
  it("fails closed on unexpected exceptions", async () => {
    const coordinate = createRefreshCoordinator();
    expect((await coordinate(old, vi.fn().mockRejectedValue(new Error("failed")))).error).toBe("RefreshTokenError");
  });
  it("bounds memory and never evicts a pending refresh", async () => {
    const coordinate = createRefreshCoordinator(15_000, 1);
    let resolve: (value: JWT) => void = () => {};
    const pending = coordinate(old, () => new Promise<JWT>((done) => { resolve = done; }));
    await Promise.resolve();
    const second = await coordinate({ ...old, refresh_token: "other" }, async (token) => token);
    expect(second.error).toBe("RefreshTokenError");
    resolve({ ...old, refresh_token: "rotated" });
    expect((await pending).refresh_token).toBe("rotated");
  });
});
