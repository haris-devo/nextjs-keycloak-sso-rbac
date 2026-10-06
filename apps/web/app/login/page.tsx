// apps/web/app/login/page.tsx
import { loginAction } from "@/app/actions";
import { safeReturnTo } from "@/lib/return-to";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RouteHeading } from "@/components/route-heading";

export default async function Login({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  const params = await searchParams;
  return <Card className="mx-auto my-10 max-w-xl">
    <RouteHeading eyebrow="Account / Sign in" title="Sign in to your workspace" description="Continue to Keycloak to sign in. Your password is entered only on the identity provider." />
    {params.error ? <p role="alert" className="mb-5 text-sm text-red-700">Sign-in could not be completed. Try again.</p> : null}
    <form action={loginAction}>
      <input type="hidden" name="returnTo" value={safeReturnTo(params.returnTo)} />
      <Button>Sign in with Keycloak</Button>
    </form>
  </Card>;
}
