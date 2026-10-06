// apps/web/lib/admin-stats.ts
import { AccessError, requireRole, type AppSession } from "./rbac";

export function adminStats(session: AppSession): Response {
  try {
    requireRole(session, ["admin"]);
    // This is sample data, not analytics about the Keycloak database.
    return Response.json({ source: "demo", configuredRoles: 3, configuredDemoUsers: 3, records: [] },
      { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (!(error instanceof AccessError)) throw error;
    return Response.json({ error: error.code }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
}
