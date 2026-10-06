# Security model

This document describes implemented code paths. Runtime and deployment checks have not been performed. See [VERIFICATION.md](VERIFICATION.md) for the evidence boundary.

## OIDC login

The confidential `web` client accepts only the standard authorization code flow. Implicit flow, direct password grants, and service accounts are disabled. The client requires PKCE S256. Auth.js explicitly enables `pkce`, `state`, and `nonce` checks. Users enter passwords at Keycloak; the Next.js app never receives them.

Auth.js validates the OIDC login response. The app separately validates access tokens against Keycloak's JWKS, enforcing RS256, issuer, audience `web`, subject, issued-at presence, and expiration. The imported audience mapper makes the access-token audience explicit. Roles come from `realm_access.roles` in that verified access token. Only `admin`, `editor`, and `viewer` are retained. ID-token roles and browser-supplied session updates are not authority for access.

Discovery metadata is restricted to the configured Keycloak issuer and its expected token, logout, and JWKS endpoints. Discovery and JWKS fetches have a 10-second timeout. Metadata is cached in a process after validation; failed discovery can be retried on a later request. Key rotation uses jose's remote JWKS behavior.

## Token storage and public session data

Auth.js uses its encrypted JWT session strategy. Access, refresh, and the validated login ID token are inside an HttpOnly cookie, not localStorage. Cookie options are `SameSite=Lax`, `Path=/`, and `Secure` for HTTPS, with the `__Secure-` name prefix for HTTPS. Local HTTP on `localhost` is an explicit development exception. No other HTTP host is accepted by environment validation. The production Compose file supplies HTTPS values.

The browser stores encrypted provider-token material in its cookie jar. HttpOnly prevents application JavaScript from reading it; it does not mean the material is stored only on the server. Auth.js can chunk large session cookies. `getToken` in the logout action reassembles them server-side. Test proxy header limits with representative token sizes before deployment. A leaked `AUTH_SECRET` compromises all JWT sessions and requires secret rotation and reauthentication.

The session callback returns a new allowlist object containing user name, email, roles, session expiry, and optional `RefreshTokenError`. No access token, refresh token, ID token, subject, or provider expiry field is added to the session response. Server components receive that projected identity. The client error boundary receives no session props. Tokens are not intentionally logged. Browser test captures are disabled.

## Authorization

`proxy.ts` checks protected route prefixes. Every protected server page independently calls `requirePageRole`, which invokes the shared `requireRole`. The stats API invokes `requireRole` through its response helper even when the route guard has already allowed the request. A missing session returns API 401, an expired session returns API 401, and insufficient roles return API 403. UI navigation links use the same role policy as a usability feature.

Role changes are picked up on the next access-token refresh, usually within the 120-second demo lifetime. The app does not introspect every request or implement Keycloak backchannel logout. An already issued JWT can remain usable until refresh or its local expiry after external account/session changes. Sensitive deployments must decide whether that delay is acceptable.

## Refresh rotation

The realm revokes refresh tokens with maximum reuse zero. Refresh requires a new nonempty refresh token and a valid signed access token for the same subject. Roles are replaced from the new token. The expiry is the earlier of the signed expiry and endpoint `expires_in`. The original validated login ID token is retained only for logout hints. Refresh errors clear effective roles, set `RefreshTokenError`, and stop automatic retry. Reauthentication requests `prompt=login`.

The coordinator hashes refresh tokens for its keys, shares in-flight work, and keeps results for a 15-second grace window. It caps entries at 256 and removes expired entries on subsequent refresh calls. Results contain sensitive tokens in server memory during that window. It coordinates one process only. Separate instances, restarts, and requests outside the grace window can still consume the same rotating token. These cases deny access and ask for sign-in; they do not fall back to stale admin roles. See [ADR 005](adr/005-refresh-coordination.md).

JWT refresh performed in a read-only Server Component cannot persist its cookie. The Auth.js route-guard wrapper and auth route responses write updated cookies. Protected paths always pass through the guard, including prefetched requests. The UI disables protected-link prefetch to reduce incidental auth work; authorization does not depend on that setting.

## Logout

The sign-out server action clears the app session and redirects the browser to the validated `end_session_endpoint` with `id_token_hint` and the exact `post_logout_redirect_uri`. The ID token is necessarily sent to Keycloak as an OIDC logout hint. `Referrer-Policy: no-referrer` reduces subsequent referrer disclosure. Caddy access logging is not enabled in this example; do not enable raw query-string logs for authentication endpoints.

If the app cookie has already expired, logout supplies `client_id` without a hint and Keycloak may show a confirmation. If discovery fails, the app still clears its session but explicitly reports that the SSO session may remain active. App logout is not a global forced logout of other independent relying parties.

## Deployment boundary

Only Caddy publishes public ports in production. Postgres has no host port. Keycloak HTTP and management ports are not published. The database network is internal. Caddy overwrites identity-related proxy headers and exposes only `/realms/demo`, its descendants, and login resources on the public auth hostname. Public admin, master realm, health, and metrics requests receive 403. A separate TLS listener is published only on host loopback for an SSH admin tunnel.

`trustHost` is enabled because the app is behind the supplied Caddy configuration, which fixes the public Host and forwarded host/protocol. Exposing the web service directly or changing proxies requires a new host-trust review. Host and private-network access must remain under operator control. The health endpoint reports only app availability and does not prove Keycloak reachability or a functioning login.

## Credentials and scope

Bootstrap credentials and client secrets are supplied by generated local env files or a production env file. The realm seed uses Keycloak `${AUTH_KEYCLOAK_SECRET}` substitution. The only committed passwords are explicitly fake public demo-user passwords. Generated env files are ignored and excluded from the portfolio archive. Production env values must be generated separately; local bootstrap is never used for VPS secrets.

Brute-force protection is enabled in the demo realm. This is not a substitute for operator monitoring or an app-wide abuse policy. MFA enrollment, per-request introspection, distributed refresh coordination, centralized session revocation, CSP nonce plumbing, multi-tenancy, and independent security certification are outside scope. Do not represent this code-only review as a penetration test.
