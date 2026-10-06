// scripts/bootstrap-local.mjs
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const infraPath = `${root}infra/.env`;
const webPath = `${root}apps/web/.env.local`;
const secret = () => randomBytes(32).toString("hex");

if (!existsSync(infraPath)) {
  const text = [
    "# Generated local credentials. Never commit this file.",
    `POSTGRES_PASSWORD=${secret()}`,
    "KEYCLOAK_ADMIN=local-admin",
    `KEYCLOAK_ADMIN_PASSWORD=${secret()}`,
    `AUTH_KEYCLOAK_SECRET=${secret()}`,
    "WEB_ORIGIN=http://localhost:3000",
    "",
  ].join("\n");
  writeFileSync(infraPath, text, { mode: 0o600, flag: "wx" });
}
const infra = parseEnv(readFileSync(infraPath, "utf8"));
for (const key of ["POSTGRES_PASSWORD", "KEYCLOAK_ADMIN_PASSWORD", "AUTH_KEYCLOAK_SECRET"]) {
  if (!infra[key] || infra[key].startsWith("replace-")) {
    throw new Error(`Set ${key} in infra/.env, or remove unused local env files and regenerate.`);
  }
}
if (infra.WEB_ORIGIN !== "http://localhost:3000") {
  throw new Error("The local bootstrap only supports WEB_ORIGIN=http://localhost:3000. See docs/DEPLOY.md for HTTPS.");
}
if (!existsSync(webPath)) {
  writeFileSync(webPath, [
    "# Generated local credentials. Never commit this file.",
    `AUTH_SECRET=${secret()}`,
    "AUTH_URL=http://localhost:3000",
    "AUTH_KEYCLOAK_ID=web",
    `AUTH_KEYCLOAK_SECRET=${infra.AUTH_KEYCLOAK_SECRET}`,
    "AUTH_KEYCLOAK_ISSUER=http://localhost:8080/realms/demo",
    "",
  ].join("\n"), { mode: 0o600, flag: "wx" });
}
const web = parseEnv(readFileSync(webPath, "utf8"));
if (web.AUTH_KEYCLOAK_SECRET !== infra.AUTH_KEYCLOAK_SECRET) {
  throw new Error("The local client secrets do not match. Align the env files and the existing Keycloak client.");
}
console.log("Local env files are ready. Existing values were preserved.");
