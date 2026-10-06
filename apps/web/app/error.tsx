// apps/web/app/error.tsx
// This client boundary is required by Next.js to retry a failed render.
"use client";

import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div role="alert" className="rounded-2xl border border-border bg-card p-8">
    <h1 className="text-2xl font-semibold">This page could not be loaded</h1>
    <p className="my-4 text-muted-foreground">Try again. If the problem continues, return to the homepage and sign in again.</p>
    <Button onClick={reset}>Try again</Button>
  </div>;
}
