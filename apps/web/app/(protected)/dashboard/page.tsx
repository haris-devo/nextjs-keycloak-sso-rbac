// apps/web/app/(protected)/dashboard/page.tsx
import { requirePageRole } from "@/lib/page-access";
import { Card } from "@/components/ui/card";
import { RouteHeading } from "@/components/route-heading";
import { EmptyState } from "@/components/empty-state";

export default async function Dashboard() {
  const user = await requirePageRole();
  return <>
    <RouteHeading eyebrow="Workspace / Dashboard" title={`Welcome, ${user.name ?? "there"}`} description="Your identity comes from Keycloak. Your role determines which workspaces you can open." />
    <Card>
      <h2 className="text-lg font-semibold">Your account</h2>
      <dl className="mt-6 grid gap-5 sm:grid-cols-3">
        <div><dt className="text-xs text-muted-foreground">Name</dt><dd className="mt-1 font-medium">{user.name ?? "Not provided"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Email</dt><dd className="mt-1 break-all font-medium">{user.email ?? "Not provided"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Roles</dt><dd className="mt-1 font-medium">{user.roles.join(", ") || "No application roles"}</dd></div>
      </dl>
    </Card>
    <section className="mt-8" aria-label="Recent activity"><EmptyState title="No recent activity" description="This example does not store workspace activity." /></section>
  </>;
}
