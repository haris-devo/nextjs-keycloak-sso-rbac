# Deploy the HTTPS example on a VPS

This is a deployment recipe, not an observed live deployment. The app and Caddy have not been started during this implementation. Use a small Ubuntu 24.04 VPS with at least 2 CPU cores and 4 GB RAM as a starting assumption for building and running the example. Real capacity depends on workload; it has not been measured.

## 1. Prepare Ubuntu and Docker

Upload and extract the source archive into `/opt/nextjs-keycloak-sso-rbac`, or copy the repository directory there. No GitHub account or remote repository is required.

Install Docker from its official Ubuntu repository. See [Docker's Ubuntu installation documentation](https://docs.docker.com/engine/install/ubuntu/) if your OS version differs.

```sh
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: noble
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

The commands below use `sudo docker`, so no Docker group membership is needed. Docker access grants broad host privileges. Keep operator access limited to administrators.

## 2. Configure DNS and ports

Create `web.your-domain.com` and `auth.your-domain.com` A records pointing to the VPS public IPv4 address. Add AAAA records only if IPv6 routing actually works. Both browser and web container must reach the same public auth hostname. Some provider firewalls require explicit rules for traffic to the VPS's own public address.

Allow SSH, HTTP 80/TCP, HTTPS 443/TCP, and optionally HTTPS 443/UDP at the provider firewall. Postgres, Keycloak 8080, management 9000, and the private admin listener 8443 must not be exposed publicly. The Compose file publishes 8443 only on `127.0.0.1`. Caddy uses port 80 for automatic HTTPS challenges and redirects.

## 3. Supply deployment credentials

```sh
cd /opt/nextjs-keycloak-sso-rbac
cp infra/.env.example infra/.env.prod
chmod 600 infra/.env.prod
openssl rand -hex 32
```

Run the last command separately for each of `POSTGRES_PASSWORD`, `KEYCLOAK_ADMIN_PASSWORD`, `AUTH_KEYCLOAK_SECRET`, and `AUTH_SECRET`. Edit `infra/.env.prod` with those distinct values and your actual `WEB_DOMAIN`, `AUTH_DOMAIN`, `WEB_ORIGIN`, and `ACME_EMAIL`. Do not paste credentials into command arguments or commits. `WEB_ORIGIN` should equal `https://` plus `WEB_DOMAIN`; the production Compose file derives its runtime origin from `WEB_DOMAIN`.

The Keycloak and web containers receive the same confidential-client secret. The realm seed substitutes `${AUTH_KEYCLOAK_SECRET}` and `${WEB_ORIGIN}` through Keycloak's import system. Compose mounts `realm-export.json` under the required startup-import name `demo-realm.json`.

The seed contains known public demo-user passwords, including an admin of the demo application. Keep that deployment isolated to sample data. If repurposing the application for private use, replace or disable those accounts before opening the public site. Keycloak's bootstrap administrator is a separate account, not the demo user alice.

## 4. Validate configuration and start

The production Compose file is independent of the development file. Do not combine them as overrides, since that could carry development settings into the deployment.

```sh
sudo docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml config --quiet
sudo docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml run --rm --no-deps caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml up -d --build --wait
sudo docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml ps
```

The Keycloak image is built for Postgres with health and metrics enabled, then starts with `--optimized --import-realm`. Runtime config uses `KC_HOSTNAME=https://<auth-domain>`, `KC_PROXY_HEADERS=xforwarded`, `KC_HTTP_ENABLED=true`, and `KC_DB=postgres`. It does not use `KC_PROXY`. Caddy terminates TLS. The Node app uses standalone output and runs as a non-root user.

Keycloak waits for Postgres. Web startup validates configuration and its health endpoint reports app readiness without requiring Caddy. Caddy then starts and obtains certificates. This avoids requiring the public issuer before the proxy exists. Automatic TLS issuance is still an external operation and needs its own check.

Do not print full `docker compose config` output on shared systems: it contains expanded credentials. `config --quiet` avoids that output. Avoid raw HTTP/access logs for OIDC queries and cookies.

## 5. Verify the actual server

```sh
curl -fsS https://web.your-domain.com/api/health
curl -fsS https://auth.your-domain.com/realms/demo/.well-known/openid-configuration
curl -o /dev/null -s -w '%{http_code}\n' https://auth.your-domain.com/admin/
curl -o /dev/null -s -w '%{http_code}\n' https://auth.your-domain.com/realms/master/.well-known/openid-configuration
```

Health should return `ok`, discovery must contain the exact public issuer, and the two private paths should return 403. Repeat private-path checks with encoded separators and path variants; the public listener uses an allowlist for the demo realm rather than attempting to list every administrative endpoint.

Verify discovery from the app container too:

```sh
sudo docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml exec -T web node -e 'fetch(process.env.AUTH_KEYCLOAK_ISSUER+"/.well-known/openid-configuration").then(async r=>{if(!r.ok)throw Error("Discovery failed");const d=await r.json();if(d.issuer!==process.env.AUTH_KEYCLOAK_ISSUER)throw Error("Issuer mismatch");console.log("Issuer reachable and matched")}).catch(()=>process.exit(1))'
```

In a browser, check all three users, denied routes, API 401/403/200 responses, secure HttpOnly cookies, refresh after two minutes, failed refresh, and logout followed by a new credentials prompt. Check certificates for both hostnames. The local Playwright suite is scoped to HTTP localhost; use these manual checks for real HTTPS deployment rather than pretending local browser tests prove it.

## 6. Reach the admin console through SSH

The public auth listener exposes only the demo realm and login resources. A separate Caddy TLS listener on port 8443 proxies administrative paths but is published only on VPS loopback. Keycloak continues to emit its public hostname and port 443, so the browser must see that same origin when using the tunnel.

On an operator workstation, temporarily map `auth.your-domain.com` to `127.0.0.1` in its hosts file. Forward local port 443 to the server's private port 8443:

```sh
ssh -N -L 127.0.0.1:443:127.0.0.1:8443 deploy@your-vps-ip
```

On platforms that restrict local ports below 1024, run this tunnel with the necessary local privilege and explicitly select your operator key. For example on Linux or macOS:

```sh
sudo ssh -i /absolute/path/to/operator-key -N -L 127.0.0.1:443:127.0.0.1:8443 deploy@your-vps-ip
```

Visit `https://auth.your-domain.com/admin/` and use the bootstrap admin from `infra/.env.prod`. The private listener presents the normal auth-domain certificate and overwrites proxy headers with public port 443. Every master-realm browser request now travels through the tunnel instead of the public listener. Use a fresh browser profile to avoid DNS cache confusion. Remove the temporary hosts entry after closing the tunnel. Local port 443 must be free.

Do not publish port 8443 on all interfaces, change the public allowlist to expose master, or weaken the public issuer to make the console work. Review and remove the temporary bootstrap administrator after establishing your normal operator account.

## 7. Back up and restore Postgres

Use a database dump rather than copying a live database volume. The example uses a named volume that persists across normal shutdowns.

```sh
cd /opt/nextjs-keycloak-sso-rbac
mkdir -p backups
chmod 700 backups
umask 077
sudo docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml exec -T postgres pg_dump -U keycloak -d keycloak -Fc > backups/keycloak.dump
```

Store encrypted off-host copies and retain the env file through an appropriate secrets backup process. Database dumps contain credential hashes and identity data. Never add backups to your portfolio ZIP. Keycloak Admin Console partial exports omit users and mask secrets, so they are not database backups.

For a planned restore into a matching Postgres database, stop the identity provider and app first. The following replaces matching objects in the destination database and requires a verified backup and an intentional restore target:

```sh
sudo docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml stop caddy web keycloak
sudo docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml exec -T postgres pg_restore -U keycloak -d keycloak --clean --if-exists --no-owner < backups/keycloak.dump
sudo docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml up -d --wait
```

Test restore procedures on an isolated VPS before relying on them. Changing the client-secret env value does not update an already imported realm. Rotate that secret in Keycloak and the web configuration together. `down -v` destroys persistent volumes and is not an upgrade command.

## Limits

One web process and one Keycloak instance are intentional. No clustering, Redis token broker, Kubernetes, HA, or measured load envelope is provided. Review image/package security updates before a later deployment; exact version tags can age and do not replace vulnerability monitoring. A successful app healthcheck alone does not demonstrate working OIDC, refresh, RBAC, TLS, or backups.
