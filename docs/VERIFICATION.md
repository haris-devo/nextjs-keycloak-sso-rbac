# Code-only verification

Review date: 2026-10-06.

The working directory initially contained an empty Git repository. The supplied attachment was a specification, not source code. This repository was implemented from that specification after the instruction to complete the code end to end. The later instruction takes precedence over the attachment's request to stop after each phase. No GitHub repository, remote action, or commit was created.

## Checks completed

| Check | Evidence | Result |
| --- | --- | --- |
| Direct version metadata | npm registry metadata and official project docs | Exact versions pinned; Auth.js v5 beta stated explicitly |
| Dependency resolution | `pnpm install --lockfile-only --ignore-scripts` | Lockfile generated without project dependencies or lifecycle scripts |
| Peer compatibility | `pnpm peers check` | No peer dependency issues after choosing supported TypeScript and ESLint versions |
| TypeScript and TSX syntax | Integrity-verified TypeScript parser in a temporary file | Source files parsed without syntax errors; no explicit `any` types |
| Local source imports | Static path-resolution scan | All relative and `@/` imports resolve to source files |
| JavaScript configuration syntax | `node --check` on bootstrap, ESLint, and PostCSS files | Passed without executing those files |
| JSON and Python syntax | JSON parsing and Python AST parsing | Passed |
| YAML syntax | Ruby Psych syntax parser, including multi-document pnpm lockfile | Workspace, lockfile, workflow, and Compose files parsed |
| Development Compose | `docker compose --env-file infra/.env.example -f infra/docker-compose.yml config --quiet` | Passed without starting containers |
| Production Compose | `docker compose --env-file infra/.env.example -f infra/docker-compose.prod.yml config --quiet` | Passed without starting containers |
| Credential patterns | Scan for recognizable private keys, GitHub tokens, and AWS access keys; inspection of env templates and demo seed | No matches or generated real env files. Demo passwords and test fixtures are intentionally fake |
| Documentation consistency | Compared routes, realm seed, guards, callbacks, cookies, refresh, logout, images, and scripts with prose | Aligned; limitations explicitly described |
| Portfolio archive | Generated the source ZIP and inspected its entries and CRC integrity | 88 source files; required files present; no Git internals, node modules, real env files, or build artifacts |

The credential-pattern scan is a focused static check, not proof that every possible secret format is detectable. The Git repository still has no commits, so there is no committed history to audit. Only `.env.example` files exist; running local bootstrap later creates ignored private files.

The TypeScript parser checked syntax only. It did not resolve framework types or perform a TypeScript typecheck. Dependency peer metadata is not proof of runtime compatibility. Static configuration parsing does not verify that image tags pull successfully or that services boot.

## Design findings addressed

- Used `proxy.ts` for Next.js 16 while retaining independent authorization inside protected pages and the API.
- Mounted the realm seed as `demo-realm.json`, the startup-import filename required by Keycloak, while keeping the requested repository filename `realm-export.json`.
- Kept the same issuer for browser and server, including production public-issuer traffic from the app container.
- Verified access-token signatures and replaced roles at refresh instead of trusting an unverified decoded payload or browser update.
- Required rotated refresh tokens and failed closed on incomplete responses, changed subjects, timeout, or provider error.
- Preserved updated cookies in the Auth.js route guard. Documented that Server Components alone cannot persist token rotation.
- Restricted session projection to identity, roles, expiry, and a safe error code.
- Preserved the validated login ID token for the RP-initiated logout hint and handled missing-cookie and unavailable-provider paths explicitly.
- Kept the public auth listener on an allowlist and documented a private admin tunnel that preserves Keycloak's public origin.
- Selected lint-compatible exact TypeScript and ESLint versions after peer inspection.
- Disabled browser auth captures and avoided token-bearing application error logs.

## Checks intentionally not executed

Per the request, no app server, Keycloak server, Postgres server, Caddy server, unit suite, browser suite, or application build was run. No `node_modules` directory was installed. Caddy is not installed on the host, so its own validator was not run. The CI workflow was authored but never submitted to GitHub.

Still unverified:

1. `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.
2. Clean first boot and repeatable realm import with actual Keycloak images.
3. Browser login identity and role checks for all three accounts.
4. Real refresh rotation, cookie persistence, concurrent request behavior, and process-bundle boundaries.
5. End-session logout and credentials prompt after signing in again.
6. Playwright outcomes, including expired-session and API status assertions.
7. Caddy validation, certificate issuance, private admin tunnel, and public path blocking.
8. Production DNS and public issuer reachability from the app container.
9. Backup restore and any performance or capacity measurements.

The full source can be shared as a portfolio example with this verification status visible. It should not be labelled as build-verified, test-passing, deployed, or production-certified until the relevant checks are performed. Test code and deploy configuration are included so a reviewer can perform those checks later.
