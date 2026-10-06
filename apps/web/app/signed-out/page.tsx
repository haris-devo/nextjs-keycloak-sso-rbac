// apps/web/app/signed-out/page.tsx
import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RouteHeading } from "@/components/route-heading";

export default async function SignedOut({ searchParams }: { searchParams: Promise<{ upstream?: string }> }) {
  const { upstream } = await searchParams;
  return <Card className="mx-auto my-10 max-w-xl">
    <RouteHeading eyebrow="Account / Signed out" title="You are signed out of this app" description={upstream === "unavailable" ? "Keycloak could not be reached. Its SSO session may still be active. You can retry its logout when the service is available." : "Your app session has ended. You can return home or sign in with another account."} />
    <div className="flex flex-wrap gap-3">
      <Button asChild><Link href="/">Return home</Link></Button>
      {upstream === "unavailable" ? <form action={logoutAction}><Button variant="outline">Retry Keycloak logout</Button></form> : null}
    </div>
  </Card>;
}
