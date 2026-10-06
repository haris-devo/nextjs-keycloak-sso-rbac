// apps/web/app/(protected)/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { requirePageRole } from "@/lib/page-access";
import { hasRole } from "@/lib/rbac";
import { logoutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await requirePageRole();
  return <>
    <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
      <nav aria-label="Workspace" className="flex flex-wrap gap-5 text-sm font-medium">
        <Link href="/dashboard" prefetch={false}>Dashboard</Link>
        {hasRole(user.roles, ["editor", "admin"]) ? <Link href="/editor" prefetch={false}>Editor</Link> : null}
        {hasRole(user.roles, ["admin"]) ? <Link href="/admin" prefetch={false}>Admin</Link> : null}
      </nav>
      <form action={logoutAction}><Button variant="outline" size="sm">Sign out</Button></form>
    </div>
    {children}
  </>;
}
