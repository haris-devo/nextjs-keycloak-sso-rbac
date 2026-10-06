// apps/web/lib/rbac.ts
export const roles = ["admin", "editor", "viewer"] as const;
export type Role = (typeof roles)[number];
export type Identity = { name?: string | null; email?: string | null; roles: Role[] };
export type AppSession = { user?: Identity; error?: "RefreshTokenError" } | null;

export function isRole(value: unknown): value is Role {
  return value === "admin" || value === "editor" || value === "viewer";
}

export function hasRole(assigned: readonly Role[], allowed: readonly Role[]): boolean {
  return allowed.some((role) => assigned.includes(role));
}

export class AccessError extends Error {
  constructor(public readonly status: 401 | 403, public readonly code: "Unauthenticated" | "SessionExpired" | "Forbidden") {
    super(code);
    this.name = "AccessError";
  }
}

export function requireRole(session: AppSession, allowed: readonly Role[] = []): Identity {
  if (!session?.user) throw new AccessError(401, "Unauthenticated");
  if (session.error) throw new AccessError(401, "SessionExpired");
  if (allowed.length && !hasRole(session.user.roles, allowed)) throw new AccessError(403, "Forbidden");
  return session.user;
}

export function routeRoles(path: string): readonly Role[] | undefined {
  const under = (prefix: string) => path === prefix || path.startsWith(`${prefix}/`);
  if (under("/admin") || under("/api/admin")) return ["admin"];
  if (under("/editor")) return ["admin", "editor"];
  if (under("/dashboard")) return [];
  return undefined;
}
