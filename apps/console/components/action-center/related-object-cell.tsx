import type { ActionRelatedObject } from "@/lib/action-list-display";

export function RelatedObjectCell({
  related,
}: {
  related: ActionRelatedObject;
}) {
  return (
    <>
      <p className="font-mono text-xs font-medium tabular-nums">{related.id}</p>
      <p className="text-muted-foreground text-[11px]">{related.type}</p>
    </>
  );
}
