// apps/web/components/access-denied.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RouteHeading } from "@/components/route-heading";

export function AccessDenied() {
  return <Card className="mx-auto my-10 max-w-xl">
    <RouteHeading eyebrow="403 / Permission denied" title="This page needs a different role" description="Your account does not have permission to view this page. You can return to the dashboard or sign out and use another account." />
    <Button asChild><Link href="/dashboard">Return to dashboard</Link></Button>
  </Card>;
}
