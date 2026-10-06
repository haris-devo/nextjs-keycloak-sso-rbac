// apps/web/components/loading-state.tsx
export function LoadingState() {
  return <div role="status" aria-live="polite" className="space-y-5 py-8">
    <p className="text-sm text-muted-foreground">Loading your workspace...</p>
    <div aria-hidden="true" className="h-10 w-52 animate-pulse rounded bg-muted motion-reduce:animate-none" />
    <div aria-hidden="true" className="h-48 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
  </div>;
}
