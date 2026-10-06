// apps/web/app/actions.ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";
import { signIn, signOut, sessionCookieName } from "@/auth";
import { getEnv } from "@/lib/env";
import { getMetadata } from "@/lib/oidc";
import { logoutUrl } from "@/lib/logout";
import { safeReturnTo } from "@/lib/return-to";

export async function loginAction(form: FormData) {
  const redirectTo = safeReturnTo(form.get("returnTo"));
  await signIn("keycloak", { redirectTo }, form.get("reauthenticate") === "true" ? { prompt: "login" } : undefined);
}

export async function logoutAction() {
  const env = getEnv();
  const token = await getToken({
    req: new Request(env.AUTH_URL, { headers: await headers() }),
    secret: env.AUTH_SECRET, cookieName: sessionCookieName, salt: sessionCookieName,
    secureCookie: env.AUTH_URL.startsWith("https://"),
  });
  let endpoint: string;
  try {
    endpoint = (await getMetadata()).end_session_endpoint;
  } catch {
    // The local session still ends. Tell the user that upstream logout is unconfirmed.
    await signOut({ redirect: false });
    redirect("/signed-out?upstream=unavailable");
  }
  const target = logoutUrl(endpoint, env.AUTH_URL, env.AUTH_KEYCLOAK_ID, token?.id_token);
  await signOut({ redirect: false });
  // The browser must visit Keycloak so its own SSO cookie can be cleared.
  redirect(target);
}
