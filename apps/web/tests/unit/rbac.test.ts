// apps/web/tests/unit/rbac.test.ts
import { describe, expect, it } from "vitest";
import { AccessError, hasRole, isRole, requireRole, routeRoles } from "@/lib/rbac";

describe("role enforcement", () => {
  it("accepts only application roles", () => {
    expect(["admin", "editor", "viewer", "realm-admin", "offline_access", null].filter(isRole)).toEqual(["admin", "editor", "viewer"]);
  });
  it("uses explicit OR checks and gives admin editor access only when allowed", () => {
    expect(hasRole(["admin"], ["editor", "admin"])).toBe(true);
    expect(hasRole(["admin"], ["editor"])).toBe(false);
    expect(hasRole(["viewer"], ["editor", "admin"])).toBe(false);
  });
  it("rejects missing sessions with 401", () => {
    try { requireRole(null, ["admin"]); expect.fail("Expected denial"); }
    catch (error) { expect(error).toBeInstanceOf(AccessError); expect(error).toMatchObject({ status: 401, code: "Unauthenticated" }); }
  });
  it("rejects stale roles when refresh failed", () => {
    expect(() => requireRole({ user: { roles: ["admin"] }, error: "RefreshTokenError" }, ["admin"]))
      .toThrow("SessionExpired");
  });
  it("rejects the wrong role with 403", () => {
    try { requireRole({ user: { roles: ["viewer"] } }, ["admin"]); expect.fail("Expected denial"); }
    catch (error) { expect(error).toMatchObject({ status: 403, code: "Forbidden" }); }
  });
  it("allows any authenticated identity on the dashboard", () => {
    expect(requireRole({ user: { name: "User", roles: [] } }).name).toBe("User");
  });
  it("guards descendants without matching similarly named routes", () => {
    expect(routeRoles("/admin/settings")).toEqual(["admin"]);
    expect(routeRoles("/api/admin/stats")).toEqual(["admin"]);
    expect(routeRoles("/editor/drafts")).toEqual(["admin", "editor"]);
    expect(routeRoles("/dashboard")).toEqual([]);
    expect(routeRoles("/administrator")).toBeUndefined();
    expect(routeRoles("/api/administer")).toBeUndefined();
  });
});
