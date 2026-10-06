// apps/web/app/(protected)/admin/page.tsx
import Link from "next/link";
import { requirePageRole } from "@/lib/page-access";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RouteHeading } from "@/components/route-heading";
import { EmptyState } from "@/components/empty-state";

export default async function Admin() {
  await requirePageRole(["admin"]);
  return <>
    <RouteHeading eyebrow="Workspace / Admin" title="Admin workspace" description="Only admins can access this page and the stats endpoint. Sample values below describe the committed demo configuration." />
    <div className="mb-8 grid gap-4 sm:grid-cols-2">
      <Card><p className="text-sm text-muted-foreground">Configured demo users</p><p className="mt-3 text-4xl font-semibold">3</p></Card>
      <Card><p className="text-sm text-muted-foreground">Configured roles</p><p className="mt-3 text-4xl font-semibold">3</p></Card>
    </div>
    <EmptyState title="No managed records" description="The stats API returns an empty collection and explicitly labels its values as demo data." />
    <div className="mt-6"><Button variant="outline" asChild><Link href="/api/admin/stats" prefetch={false}>View protected stats JSON</Link></Button></div>
  </>;
}
