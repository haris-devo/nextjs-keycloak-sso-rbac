// apps/web/lib/logout.ts
export function logoutUrl(endpoint: string, origin: string, clientId: string, idToken?: string): string {
  const url = new URL(endpoint);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("post_logout_redirect_uri", `${origin}/signed-out`);
  if (idToken) url.searchParams.set("id_token_hint", idToken);
  return url.href;
}
