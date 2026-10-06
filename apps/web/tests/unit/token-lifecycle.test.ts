// apps/web/tests/unit/token-lifecycle.test.ts
import { describe, expect, it, vi } from "vitest";
import type { JWT } from "next-auth/jwt";
import { maintainToken, refreshAccessToken, type RefreshDependencies, type ValidatedAccess } from "@/lib/token-lifecycle";

const now = 1_000_000;
const old: JWT = { sub: "alice-id", name: "Alice", roles: ["admin"], access_token: "old-access", refresh_token: "old-refresh", id_token: "login-id", expires_at: 999 };
const responseBody = { access_token: "new-access", refresh_token: "rotated-refresh", id_token: "refresh-id", expires_in: 120, token_type: "Bearer" };
function deps(body: unknown = responseBody, status = 200): RefreshDependencies {
  return { endpoint: "https://auth.example.com/realms/demo/protocol/openid-connect/token", clientId: "web", clientSecret: "test-only-client-secret",
    now: () => now, fetcher: vi.fn(async () => Response.json(body, { status })),
    validateAccess: vi.fn(async (): Promise<ValidatedAccess> => ({ subject: "alice-id", expiresAt: 1120, roles: ["editor"] })),
  };
}

describe("access token lifecycle", () => {
  it("refreshes with a form-encoded request and stores the rotated refresh token", async () => {
    const dependencies = deps();
    const next = await refreshAccessToken(old, dependencies);
    expect(next).toMatchObject({ access_token: "new-access", refresh_token: "rotated-refresh", expires_at: 1120, roles: ["editor"] });
    expect(next.id_token).toBe("login-id");
    expect(next.error).toBeUndefined();
    expect(old.refresh_token).toBe("old-refresh");
    const call = vi.mocked(dependencies.fetcher!).mock.calls[0];
    const request = call[1]!;
    expect(request.method).toBe("POST");
    expect(request.cache).toBe("no-store");
    expect(request.body).toBeInstanceOf(URLSearchParams);
    const body = request.body as URLSearchParams;
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("old-refresh");
    expect(body.get("client_secret")).toBe("test-only-client-secret");
  });
  it("clears roles and fails closed after invalid_grant", async () => {
    expect(await refreshAccessToken(old, deps({ error: "invalid_grant" }, 400)))
      .toMatchObject({ error: "RefreshTokenError", roles: [] });
  });
  it("does not silently reuse a refresh token when rotation is missing", async () => {
    expect((await refreshAccessToken(old, deps({ ...responseBody, refresh_token: undefined }))).error).toBe("RefreshTokenError");
  });
  it.each([null, {}, { ...responseBody, expires_in: 0 }, { ...responseBody, expires_in: "120" }, { ...responseBody, token_type: "unknown" }])("rejects malformed responses %j", async (body) => {
    expect((await refreshAccessToken(old, deps(body))).error).toBe("RefreshTokenError");
  });
  it("fails closed on network errors without retrying", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("timeout"));
    expect((await refreshAccessToken(old, { ...deps(), fetcher })).error).toBe("RefreshTokenError");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("rejects invalid signatures and changes of subject", async () => {
    const invalid = deps();
    invalid.validateAccess = vi.fn().mockRejectedValue(new Error("invalid signature"));
    expect((await refreshAccessToken(old, invalid)).roles).toEqual([]);
    invalid.validateAccess = async () => ({ subject: "different-user", expiresAt: 1120, roles: ["admin"] });
    expect((await refreshAccessToken(old, invalid)).error).toBe("RefreshTokenError");
  });
  it("uses the earlier of JWT expiry and expires_in", async () => {
    const dependencies = deps();
    dependencies.validateAccess = async () => ({ subject: "alice-id", expiresAt: 1090, roles: ["admin"] });
    expect((await refreshAccessToken(old, dependencies)).expires_at).toBe(1090);
  });
  it("does not refresh a valid token", async () => {
    const refresh = vi.fn();
    const valid = { ...old, expires_at: 1120 };
    expect(await maintainToken(valid, refresh, now)).toBe(valid);
    expect(refresh).not.toHaveBeenCalled();
  });
  it("refreshes before expiry and does not retry after a recorded failure", async () => {
    const refresh = vi.fn(async () => ({ ...old, error: "RefreshTokenError" as const }));
    await maintainToken({ ...old, expires_at: 1005 }, refresh, now);
    expect(refresh).toHaveBeenCalledTimes(1);
    await maintainToken({ ...old, error: "RefreshTokenError" }, refresh, now);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("marks incomplete credentials as expired", async () => {
    expect((await maintainToken({ ...old, refresh_token: undefined }, vi.fn(), now)).error).toBe("RefreshTokenError");
  });
});
