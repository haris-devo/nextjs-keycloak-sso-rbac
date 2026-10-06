# ADR 005: Coordinate rotating refresh tokens within one process

Status: accepted for a single-instance demo.

Rotating refresh tokens with zero reuse fail if parallel requests independently refresh the same token. The app shares a promise per hashed refresh token and returns the same result to delayed requests for 15 seconds. A map is intentionally used for token lifecycle coordination, not user response caching. It has a 256-entry bound, keeps pending work, and removes expired entries lazily on later refreshes. At capacity it fails closed.

The supplied Compose deployment runs one standalone web process. Next.js route and guard bundles can still have separate module instances; hot reload, multiple workers, multiple replicas, restarts, and requests outside the grace window are not coordinated. The mechanism reduces races but does not prove their elimination, even on every possible single-container runtime. Browser tests must exercise the supplied runtime before a success claim.

A timeout may occur after Keycloak has consumed the old token. Automatic retry could consume it again, so failure forces sign-in and drops roles. The route guard writes the renewed encrypted cookie. Read-only Server Components can only read their session and cannot reliably persist rotation alone.

For multiple app instances, replace this design with a shared token store and distributed lock or a backend session broker. Redis, clustering, and a broker are outside this portfolio scope. Do not scale this implementation by adding replicas and claiming refresh coordination still holds.
