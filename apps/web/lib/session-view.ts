// apps/web/lib/session-view.ts
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

export function sessionView(token: JWT, expires: string): Session {
  // Construct an allowlist projection. Provider tokens never reach /api/auth/session.
  return {
    expires,
    user: {
      name: typeof token.name === "string" ? token.name : null,
      email: typeof token.email === "string" ? token.email : null,
      roles: token.error ? [] : token.roles ?? [],
    },
    ...(token.error ? { error: token.error } : {}),
  };
}
