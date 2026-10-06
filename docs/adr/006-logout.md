# ADR 006: Perform RP-initiated logout through the browser

Status: accepted.

Auth.js sign-out clears the app cookie. It does not by itself clear Keycloak's browser SSO session. The server action reads the encrypted session with the same cookie name and salt as Auth.js, resolves the validated end-session endpoint, clears the app cookie, and redirects the browser with an ID token hint, client ID, and exact signed-out return URI.

The validated ID token from the original login is retained as the logout hint. Keycloak supports a previously issued token as a hint; it is not used for authorization and is not replaced with an unvalidated refresh-response ID token. If no hint remains, Keycloak may ask for confirmation. If discovery is unavailable, the app ends its own session and reports the upstream uncertainty.

The logout browser test signs in again without `prompt=login` and checks that the password form is shown. A test that forces `prompt=login` would hide an incomplete SSO logout.
