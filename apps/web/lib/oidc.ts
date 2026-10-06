// apps/web/lib/oidc.ts
import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";
import { getEnv } from "./env";
import { isRole } from "./rbac";
import type { ValidatedAccess } from "./token-lifecycle";

const metadataSchema = z.object({
  issuer: z.url(), token_endpoint: z.url(), end_session_endpoint: z.url(), jwks_uri: z.url(),
});
type Metadata = z.infer<typeof metadataSchema>;
let metadataPromise: Promise<Metadata> | undefined;
let keys: ReturnType<typeof createRemoteJWKSet> | undefined;

export async function getMetadata(): Promise<Metadata> {
  if (metadataPromise) return metadataPromise;
  const issuer = getEnv().AUTH_KEYCLOAK_ISSUER;
  metadataPromise = (async () => {
    const response = await fetch(`${issuer}/.well-known/openid-configuration`, {
      cache: "no-store", signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error("OIDC discovery unavailable");
    const data = metadataSchema.parse(await response.json());
    if (data.issuer !== issuer ||
        data.token_endpoint !== `${issuer}/protocol/openid-connect/token` ||
        data.end_session_endpoint !== `${issuer}/protocol/openid-connect/logout` ||
        data.jwks_uri !== `${issuer}/protocol/openid-connect/certs`) {
      throw new Error("Discovery endpoints do not match the configured Keycloak issuer");
    }
    return data;
  })().catch((error: unknown) => { metadataPromise = undefined; throw error; });
  return metadataPromise;
}

export async function validateAccessToken(accessToken: string): Promise<ValidatedAccess> {
  const env = getEnv();
  const metadata = await getMetadata();
  keys ??= createRemoteJWKSet(new URL(metadata.jwks_uri), { timeoutDuration: 10_000 });
  const { payload } = await jwtVerify(accessToken, keys, {
    issuer: env.AUTH_KEYCLOAK_ISSUER, audience: env.AUTH_KEYCLOAK_ID,
    algorithms: ["RS256"], requiredClaims: ["sub", "exp", "iat"],
  });
  const claims = z.object({
    sub: z.string().min(1), exp: z.number().int().positive(),
    realm_access: z.object({ roles: z.array(z.string()) }),
  }).parse(payload);
  return { subject: claims.sub, expiresAt: claims.exp, roles: [...new Set(claims.realm_access.roles.filter(isRole))] };
}
