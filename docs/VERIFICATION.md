# Verification

## Automated checks

Every push runs the [Verify workflow](../.github/workflows/ci.yml):

| Job | Steps |
| --- | --- |
| `quality` | Install, generate local credentials, validate the Compose file, typecheck, lint, unit tests, production build |
| `e2e` | Start Keycloak and Postgres with Docker Compose, then run the Playwright browser suite against them |

The badge in the README shows the result of the latest run.

## Local results

Run on 2026-10-06 (macOS, Node.js 24, pnpm 12.9.1):

| Check | Command | Result |
| --- | --- | --- |
| Install | `pnpm install --frozen-lockfile` | Passed |
| Typecheck | `pnpm typecheck` | Passed |
| Lint | `pnpm lint` | Passed, no warnings |
| Unit tests | `pnpm test` | 44 tests in 5 files passed |
| Production build | `pnpm build` | Passed |

The unit suite covers authorization, API status codes, session projection, refresh response validation, rotation, network failure, changed subjects, refresh coalescing, logout URLs and realm invariants.

## Not yet verified

- Caddy configuration, certificate issuance and the private admin tunnel from `docker-compose.prod.yml`
- A production deployment, including public DNS and issuer reachability from the app container
- Backup and restore of the Keycloak database
- Performance or capacity under load

## Design decisions

- Used `proxy.ts` for Next.js 16 while retaining independent authorization inside protected pages and the API.
- Mounted the realm seed as `demo-realm.json`, the startup-import filename Keycloak expects, while keeping the repository file as `realm-export.json`.
- Kept the same issuer for browser and server, including production public-issuer traffic from the app container.
- Verified access-token signatures and replaced roles at refresh instead of trusting an unverified decoded payload or browser update.
- Required rotated refresh tokens and failed closed on incomplete responses, changed subjects, timeout, or provider error.
- Preserved updated cookies in the Auth.js route guard, since Server Components alone cannot persist token rotation.
- Restricted session projection to identity, roles, expiry, and a safe error code.
- Preserved the validated login ID token for the RP-initiated logout hint and handled missing-cookie and unavailable-provider paths explicitly.
- Kept the public auth listener on an allowlist and documented a private admin tunnel that preserves Keycloak's public origin.
- Selected lint-compatible exact TypeScript and ESLint versions after peer inspection.
- Disabled browser auth captures and avoided token-bearing application error logs.
