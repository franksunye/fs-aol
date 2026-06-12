import type { ActionContextColumn } from "@/lib/action-list-display";

export function ContextColumnCell({
  context,
}: {
  context: ActionContextColumn | undefined;
}) {
  const facets = context?.facets ?? [];
  if (!facets.length) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <div className="space-y-0.5">
      {facets.map((f) => (
        <p key={f.label} className="text-xs leading-snug">
          <span className="text-muted-foreground">{f.label}</span>
          <span className="mx-1 text-muted-foreground/60">·</span>
          <span className="font-medium tabular-nums">{f.value}</span>
        </p>
      ))}
    </div>
  );
}

export function contextColumnNarrowSubtitle(
  context: ActionContextColumn | undefined
): string | null {
  const first = context?.facets?.[0];
  if (!first) return null;
  return `${first.label} ${first.value}`;
}
