// apps/web/auth.ts
import "server-only";
import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { getEnv } from "@/lib/env";
import { getMetadata, validateAccessToken } from "@/lib/oidc";
import { createRefreshCoordinator } from "@/lib/refresh-coordinator";
import { maintainToken, refreshAccessToken } from "@/lib/token-lifecycle";
import { sessionView } from "@/lib/session-view";

const env = getEnv();
const coordinatedRefresh = createRefreshCoordinator();
export const sessionCookieName = env.AUTH_URL.startsWith("https://") ? "__Secure-authjs.session-token" : "authjs.session-token";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: sessionCookieName,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: env.AUTH_URL.startsWith("https://") },
    },
  },
  providers: [Keycloak({
    clientId: env.AUTH_KEYCLOAK_ID,
    clientSecret: env.AUTH_KEYCLOAK_SECRET,
    issuer: env.AUTH_KEYCLOAK_ISSUER,
    checks: ["pkce", "state", "nonce"],
    authorization: { params: { scope: "openid" } },
  })],
  pages: { signIn: "/login", error: "/auth-error" },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        if (!account.access_token || !account.refresh_token || !account.id_token) {
          throw new Error("Keycloak did not return the required tokens");
        }
        const claims = await validateAccessToken(account.access_token);
        if (claims.subject !== token.sub) throw new Error("OIDC subject mismatch");
        return { ...token, access_token: account.access_token, refresh_token: account.refresh_token,
          id_token: account.id_token, expires_at: claims.expiresAt, roles: claims.roles, error: undefined };
      }
      // Ignore client-supplied session updates. Keycloak is the authority for roles.
      return maintainToken(token, (old) => coordinatedRefresh(old, async (current) => {
        try {
          const metadata = await getMetadata();
          return refreshAccessToken(current, {
            endpoint: metadata.token_endpoint, clientId: env.AUTH_KEYCLOAK_ID,
            clientSecret: env.AUTH_KEYCLOAK_SECRET, validateAccess: validateAccessToken,
          });
        } catch {
          return { ...current, roles: [], error: "RefreshTokenError" };
        }
      }));
    },
    session({ session, token }) {
      return sessionView(token, session.expires);
    },
    redirect({ url }) {
      const target = new URL(url, env.AUTH_URL);
      return target.origin === env.AUTH_URL ? target.href : `${env.AUTH_URL}/dashboard`;
    },
  },
  logger: {
    // Auth.js errors can carry provider responses. Keep logs free of credentials.
    error(error) { console.error("Authentication failure", error.name); },
    warn(code) { console.warn("Authentication warning", code); },
  },
});
