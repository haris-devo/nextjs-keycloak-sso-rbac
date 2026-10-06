// apps/web/tests/unit/session-and-api.test.ts
import { describe, expect, it } from "vitest";
import { sessionView } from "@/lib/session-view";
import { adminStats } from "@/lib/admin-stats";
import { logoutUrl } from "@/lib/logout";
import { safeReturnTo } from "@/lib/return-to";

describe("public session contract", () => {
  it("never exposes provider tokens or internal JWT fields", () => {
    const session = sessionView({ sub: "private-id", name: "Alice", email: "alice@example.com", roles: ["admin"], access_token: "sensitive-access", refresh_token: "sensitive-refresh", id_token: "sensitive-id", expires_at: 123 }, "2030-01-01");
    expect(session).toEqual({ expires: "2030-01-01", user: { name: "Alice", email: "alice@example.com", roles: ["admin"] } });
    expect(JSON.stringify(session)).not.toContain("sensitive");
  });
  it("exposes failure state without stale roles", () => {
    expect(sessionView({ roles: ["admin"], error: "RefreshTokenError" }, "2030-01-01"))
      .toMatchObject({ user: { roles: [] }, error: "RefreshTokenError" });
  });
});

describe("admin API contract", () => {
  it("returns 401 without a session", () => { expect(adminStats(null).status).toBe(401); });
  it("returns 401 when refresh fails", () => { expect(adminStats({ user: { roles: ["admin"] }, error: "RefreshTokenError" }).status).toBe(401); });
  it.each(["editor", "viewer"] as const)("returns 403 for %s", (role) => { expect(adminStats({ user: { roles: [role] } }).status).toBe(403); });
  it("returns explicitly labelled demo data for admins without caching", async () => {
    const response = adminStats({ user: { roles: ["admin"] } });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toMatchObject({ source: "demo", records: [] });
  });
});

describe("logout and redirects", () => {
  it("builds the RP-initiated logout URL with an ID token hint", () => {
    const url = new URL(logoutUrl("https://auth.example.com/logout", "https://web.example.com", "web", "id token"));
    expect(url.searchParams.get("id_token_hint")).toBe("id token");
    expect(url.searchParams.get("post_logout_redirect_uri")).toBe("https://web.example.com/signed-out");
    expect(url.searchParams.get("client_id")).toBe("web");
  });
  it("supports the Keycloak confirmation fallback when the app token is gone", () => {
    expect(new URL(logoutUrl("https://auth.example.com/logout", "https://web.example.com", "web")).searchParams.has("id_token_hint")).toBe(false);
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "/api/auth/signout", "/admin?next=https://evil.example", null])("rejects unsafe return targets %s", (value) => {
    expect(safeReturnTo(value)).toBe("/dashboard");
  });
  it("accepts explicit application destinations", () => { expect(safeReturnTo("/admin")).toBe("/admin"); });
});
