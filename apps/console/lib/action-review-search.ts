import type { SuggestionRow } from "./tracking";

export function filterActionReviewsByQuery(
  rows: SuggestionRow[],
  query: string | undefined | null
): SuggestionRow[] {
  const q = query?.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const s = row.suggestion;
    const haystack = [
      row.orderNum,
      row.workOrderId,
      row.dedupeKey,
      row.city,
      s.跟进方案?.主行动,
      s.原因摘要,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
