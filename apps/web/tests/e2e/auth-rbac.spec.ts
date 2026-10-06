// apps/web/tests/e2e/auth-rbac.spec.ts
import { expect, test, type Page } from "@playwright/test";
import { encode, getToken } from "next-auth/jwt";

async function readSessionToken(page: Page) {
  const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  return getToken({ req: new Request("http://localhost:3000", { headers: { cookie } }),
    secret: process.env.AUTH_SECRET!, cookieName: "authjs.session-token", salt: "authjs.session-token" });
}

const accounts = {
  alice: { password: "Alice-demo-only-123!", role: "admin" },
  bob: { password: "Bob-demo-only-123!", role: "editor" },
  carol: { password: "Carol-demo-only-123!", role: "viewer" },
} as const;

async function login(page: Page, username: keyof typeof accounts) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in with Keycloak" }).click();
  await expect(page).toHaveURL(/localhost:8080\/realms\/demo\//);
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(accounts[username].password);
  await page.locator("#kc-login").click();
  await expect(page).toHaveURL("http://localhost:3000/dashboard");
  await expect(page.getByText(`${username}@example.com`, { exact: true })).toBeVisible();
}

test("anonymous users are redirected to login and API callers receive 401", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fadmin$/);
  const response = await request.get("/api/admin/stats");
  expect(response.status()).toBe(401);
});

test("alice can access admin, editor, and the stats API", async ({ page }) => {
  await login(page, "alice");
  expect((await page.goto("/admin"))?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Admin workspace" })).toBeVisible();
  expect((await page.goto("/editor"))?.status()).toBe(200);
  expect((await page.request.get("/api/admin/stats")).status()).toBe(200);
});

test("bob can access editor and receives 403 on admin and its API", async ({ page }) => {
  await login(page, "bob");
  expect((await page.goto("/editor"))?.status()).toBe(200);
  expect((await page.goto("/admin"))?.status()).toBe(403);
  await expect(page.getByRole("heading", { name: "This page needs a different role" })).toBeVisible();
  expect((await page.request.get("/api/admin/stats")).status()).toBe(403);
});

test("carol receives 403 on editor and admin, with role-gated navigation", async ({ page }) => {
  await login(page, "carol");
  await expect(page.getByRole("navigation", { name: "Workspace" }).getByRole("link", { name: "Editor", exact: true })).toHaveCount(0);
  expect((await page.goto("/editor"))?.status()).toBe(403);
  expect((await page.goto("/admin"))?.status()).toBe(403);
  expect((await page.request.get("/api/admin/stats")).status()).toBe(403);
});

test("the browser session endpoint exposes no provider tokens", async ({ page }) => {
  await login(page, "alice");
  const session = await (await page.request.get("/api/auth/session")).json();
  expect(Object.keys(session).sort()).toEqual(["expires", "user"]);
  expect(Object.keys(session.user).sort()).toEqual(["email", "name", "roles"]);
  expect(session.user.roles).toEqual(["admin"]);
});

test("access token expiry refreshes the session on the next protected request", async ({ page }) => {
  test.setTimeout(180_000);
  await login(page, "alice");
  const before = await readSessionToken(page);
  // Deliberately longer than the imported 120-second access token lifetime.
  await page.waitForTimeout(125_000);
  expect((await page.goto("/admin"))?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Admin workspace" })).toBeVisible();
  const after = await readSessionToken(page);
  // Compare booleans so assertion output cannot print provider tokens.
  expect((after?.expires_at ?? 0) > (before?.expires_at ?? 0)).toBe(true);
  expect(after?.refresh_token !== before?.refresh_token).toBe(true);
  expect((await page.request.get("/api/admin/stats")).status()).toBe(200);
});

test("a failed refresh redirects to the session-expired page", async ({ page }) => {
  // Only the test runner knows AUTH_SECRET. This fixture is never part of the app.
  const value = await encode({ secret: process.env.AUTH_SECRET!, salt: "authjs.session-token",
    token: { sub: "expired-fixture", roles: ["admin"], access_token: "expired-fixture", refresh_token: "invalid-fixture", id_token: "fixture", expires_at: 1 } });
  await page.context().addCookies([{ name: "authjs.session-token", value, url: "http://localhost:3000", httpOnly: true, sameSite: "Lax" }]);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/session-expired\?returnTo=%2Fadmin$/);
  await expect(page.getByRole("button", { name: "Sign in again", exact: true })).toBeVisible();
});

test("logout clears app access and ends the Keycloak SSO session", async ({ page }) => {
  await login(page, "alice");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL("http://localhost:3000/signed-out");
  expect((await page.request.get("/api/admin/stats")).status()).toBe(401);
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in with Keycloak" }).click();
  // A local-only logout would silently reuse the Keycloak SSO session here.
  await expect(page.locator("#username")).toBeVisible();
});
