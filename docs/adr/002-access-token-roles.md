# ADR 002: Read roles from signed access tokens

Status: accepted.

Keycloak maps realm roles into `realm_access.roles` on the access token and adds audience `web`. The app verifies its signature, issuer, audience, subject, and expiry with jose before reading roles. Only the three application roles are retained. Roles are not sourced from client props, session updates, or the ID token.

The ID token identifies the OIDC login and supplies the logout hint. The access token is the authorization source and is renewed during refresh. Each renewal replaces the roles, so a change in Keycloak does not remain in the app indefinitely. Role changes still have a delay up to the access-token lifetime. Per-request introspection is outside scope.
