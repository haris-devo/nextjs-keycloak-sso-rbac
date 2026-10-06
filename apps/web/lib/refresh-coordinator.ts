// apps/web/lib/refresh-coordinator.ts
import { createHash } from "node:crypto";
import type { JWT } from "next-auth/jwt";

type Entry = { promise: Promise<JWT>; expiresAt: number };

// Per-process coordination is intentional. See ADR 005 for its deployment limits.
export function createRefreshCoordinator(graceMs = 15_000, capacity = 256, now = Date.now) {
  const entries = new Map<string, Entry>();
  return async (token: JWT, refresh: (token: JWT) => Promise<JWT>): Promise<JWT> => {
    if (!token.refresh_token) return { ...token, roles: [], error: "RefreshTokenError" };
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= now()) entries.delete(key);
    }
    const key = createHash("sha256").update(token.refresh_token).digest("hex");
    const previous = entries.get(key);
    if (previous) return { ...await previous.promise };
    if (entries.size >= capacity) return { ...token, roles: [], error: "RefreshTokenError" };
    const entry: Entry = { promise: Promise.resolve(token), expiresAt: Infinity };
    entry.promise = Promise.resolve().then(() => refresh(token))
      .catch((): JWT => ({ ...token, roles: [], error: "RefreshTokenError" }))
      .then((result) => {
        entry.expiresAt = now() + graceMs;
        return result;
      });
    entries.set(key, entry);
    return { ...await entry.promise };
  };
}
