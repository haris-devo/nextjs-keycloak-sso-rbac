# ADR 001: Use Auth.js for OIDC

Status: accepted.

The app uses the pinned Auth.js v5 beta with the Keycloak provider rather than implementing an authorization code callback, PKCE, state, nonce, cookie encryption, and CSRF handling by hand. The beta status is explicit in the dependency table. The app configures all three OIDC checks and retains responsibility for its own authorization, refresh policy, and logout action.

The tradeoff is dependence on a prerelease API. Upgrades require reviewing callback contracts, cookie handling, and the login/logout browser suite. A current stable Auth.js v5 release was not available in the checked metadata.
