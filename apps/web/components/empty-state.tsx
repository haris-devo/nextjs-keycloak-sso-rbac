// apps/web/components/empty-state.tsx
export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
    <p className="font-medium">{title}</p>
    <p className="mt-2 text-sm text-muted-foreground">{description}</p>
  </div>;
}
