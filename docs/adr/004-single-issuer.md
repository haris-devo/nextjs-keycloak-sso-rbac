# ADR 004: Use one public issuer

Status: accepted.

Local Next.js runs on the host, so the browser and server both use `http://localhost:8080/realms/demo`. Production uses `https://auth.<domain>/realms/demo` from the browser and the app container. Keycloak's hostname is the full public HTTPS URL. Internal Docker names are used only as Caddy upstreams and database transport addresses.

Using a separate internal issuer would break issuer validation and can create inconsistent redirects and logout URLs. The VPS app needs network access to its own public auth domain through Caddy. Configure DNS and firewall routing accordingly and verify discovery from the web container. Caddy startup does not depend on an OIDC network call from the web health endpoint, avoiding a bootstrap cycle.
