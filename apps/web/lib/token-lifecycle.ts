// apps/web/lib/token-lifecycle.ts
import type { JWT } from "next-auth/jwt";
import type { Role } from "./rbac";

export type ValidatedAccess = { subject: string; expiresAt: number; roles: Role[] };
export type RefreshDependencies = {
  endpoint: string;
  clientId: string;
  clientSecret: string;
  validateAccess: (token: string) => Promise<ValidatedAccess>;
  fetcher?: typeof fetch;
  now?: () => number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function refreshAccessToken(token: JWT, deps: RefreshDependencies): Promise<JWT> {
  try {
    if (!token.refresh_token || !token.sub) throw new Error("Missing refresh credentials");
    const response = await (deps.fetcher ?? fetch)(deps.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token", refresh_token: token.refresh_token,
        client_id: deps.clientId, client_secret: deps.clientSecret,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error("Token endpoint rejected refresh");
    const data: unknown = await response.json();
    if (!isRecord(data) || typeof data.access_token !== "string" || !data.access_token ||
        typeof data.expires_in !== "number" || !Number.isFinite(data.expires_in) || data.expires_in <= 0 ||
        typeof data.refresh_token !== "string" || !data.refresh_token ||
        (data.token_type !== "Bearer" && data.token_type !== "bearer") ||
        (data.id_token !== undefined && (typeof data.id_token !== "string" || !data.id_token))) {
      throw new Error("Malformed rotated token response");
    }
    const claims = await deps.validateAccess(data.access_token);
    if (claims.subject !== token.sub) throw new Error("Refresh subject changed");
    const now = (deps.now ?? Date.now)();
    if (claims.expiresAt * 1000 <= now) throw new Error("Refreshed token is expired");
    return {
      ...token,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      // Keep the previously validated login ID token for RP-initiated logout.
      id_token: token.id_token,
      expires_at: Math.min(claims.expiresAt, Math.floor(now / 1000) + data.expires_in),
      roles: claims.roles,
      error: undefined,
    };
  } catch {
    // A timeout is ambiguous with rotation. Do not retry a possibly consumed token.
    return { ...token, roles: [], error: "RefreshTokenError" };
  }
}

export async function maintainToken(token: JWT, refresh: (token: JWT) => Promise<JWT>, now = Date.now()): Promise<JWT> {
  if (token.error) return token;
  if (!token.access_token || !token.refresh_token || !token.id_token || !token.expires_at) {
    return { ...token, roles: [], error: "RefreshTokenError" };
  }
  // Refresh slightly early so a token does not expire during a protected request.
  if (now < token.expires_at * 1000 - 10_000) return token;
  return refresh(token);
}
