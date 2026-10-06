// apps/web/components/route-heading.tsx
export function RouteHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="mb-8">
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
    <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{description}</p>
  </header>;
}
