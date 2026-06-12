import type { ActionRelatedObject } from "@/lib/action-list-display";

export function RelatedObjectCell({
  related,
}: {
  related: ActionRelatedObject;
}) {
  const facetValues = related.facets?.map((f) => f.value).filter(Boolean) ?? [];
  const subline =
    facetValues.length > 0
      ? `${related.type} · ${facetValues.join(" · ")}`
      : related.type;

  return (
    <>
      <p className="font-mono text-xs font-medium tabular-nums">{related.id}</p>
      <p className="text-muted-foreground text-[11px]">{subline}</p>
    </>
  );
}

export function relatedObjectNarrowSubtitle(related: ActionRelatedObject): string {
  const facet = related.facets?.[0]?.value;
  return facet ? `${related.id} · ${facet}` : related.id;
}
