// apps/web/app/(protected)/editor/page.tsx
import { requirePageRole } from "@/lib/page-access";
import { RouteHeading } from "@/components/route-heading";
import { EmptyState } from "@/components/empty-state";

export default async function Editor() {
  await requirePageRole(["editor", "admin"]);
  return <>
    <RouteHeading eyebrow="Workspace / Editor" title="Editor workspace" description="Editors and admins can access this page. The server checks your role before rendering its content." />
    <EmptyState title="No drafts yet" description="The example demonstrates access control. A publishing workflow is outside its scope." />
  </>;
}
