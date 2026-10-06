// apps/web/app/auth-error/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RouteHeading } from "@/components/route-heading";

export default function AuthError() {
  return <Card className="mx-auto my-10 max-w-xl">
    <RouteHeading eyebrow="Account / Sign-in error" title="Sign-in could not be completed" description="The identity provider may be unavailable, or the sign-in attempt may have expired. Start a new sign-in attempt." />
    <Button asChild><Link href="/login">Try signing in again</Link></Button>
  </Card>;
}
