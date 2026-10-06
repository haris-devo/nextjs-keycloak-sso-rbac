// apps/web/app/session-expired/page.tsx
import { loginAction, logoutAction } from "@/app/actions";
import { safeReturnTo } from "@/lib/return-to";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RouteHeading } from "@/components/route-heading";

export default async function SessionExpired({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const params = await searchParams;
  return <Card className="mx-auto my-10 max-w-xl">
    <RouteHeading eyebrow="Account / Session expired" title="Please sign in again" description="Your session could not be renewed. Sign in again to continue from where you left off." />
    <div className="flex flex-wrap gap-3">
      <form action={loginAction}>
        <input type="hidden" name="returnTo" value={safeReturnTo(params.returnTo)} />
        <input type="hidden" name="reauthenticate" value="true" />
        <Button>Sign in again</Button>
      </form>
      <form action={logoutAction}><Button variant="outline">Sign out</Button></form>
    </div>
  </Card>;
}
