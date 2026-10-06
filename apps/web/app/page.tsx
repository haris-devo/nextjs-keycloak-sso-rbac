// apps/web/app/page.tsx
import Link from "next/link";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return <div className="space-y-12">
    <section className="max-w-3xl py-4 sm:py-10">
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">One identity. Defined access.</p>
      <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">A workspace that knows<br />what you can access.</h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">Sign in through Keycloak and explore a dashboard with access based on your role. The server checks permission on every protected route.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <form action={loginAction}><Button size="lg">Sign in with Keycloak</Button></form>
        <Button asChild size="lg" variant="outline"><Link href="/dashboard" prefetch={false}>Open dashboard</Link></Button>
      </div>
    </section>
    <div className="grid gap-4 sm:grid-cols-3">
      {[
        ["01", "Viewer", "Read your identity and role on the dashboard."],
        ["02", "Editor", "Access the editor workspace and dashboard."],
        ["03", "Admin", "Access all workspaces and the protected stats API."],
      ].map(([number, title, description]) => <Card key={title} className="sm:p-6">
        <p className="text-xs text-muted-foreground">{number}</p>
        <h2 className="mt-6 text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </Card>)}
    </div>
    <p className="text-sm text-muted-foreground">This example contains public demo accounts. Use the credentials in the README.</p>
  </div>;
}
