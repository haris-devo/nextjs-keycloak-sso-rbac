// apps/web/tests/unit/realm.test.ts
import { describe, expect, it } from "vitest";
import realm from "../../../../infra/realm/realm-export.json";
describe("committed realm contract", () => {
  it("uses a confidential client, PKCE, exact redirects, and disabled password grants", () => {
    const client = realm.clients[0];
    expect(client).toMatchObject({ clientId: "web", publicClient: false, standardFlowEnabled: true, implicitFlowEnabled: false, directAccessGrantsEnabled: false, serviceAccountsEnabled: false, secret: "${AUTH_KEYCLOAK_SECRET}" });
    expect(client.redirectUris).toEqual(["${WEB_ORIGIN}/api/auth/callback/keycloak"]);
    expect(client.attributes["post.logout.redirect.uris"]).toBe("${WEB_ORIGIN}/signed-out");
    expect(client.attributes["pkce.code.challenge.method"]).toBe("S256");
  });
  it("enables short access tokens and one-use refresh rotation", () => {
    expect(realm).toMatchObject({ realm: "demo", accessTokenLifespan: 120, revokeRefreshToken: true, refreshTokenMaxReuse: 0 });
  });
  it("assigns one application role to each demo account", () => {
    expect(realm.users.map((user: { username: string; realmRoles: string[] }) => [user.username, user.realmRoles]))
      .toEqual([["alice", ["admin"]], ["bob", ["editor"]], ["carol", ["viewer"]]]);
  });
});
