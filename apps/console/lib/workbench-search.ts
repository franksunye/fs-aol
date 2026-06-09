import type { SuggestionRow } from "./tracking";

export function filterSuggestionsByQuery(
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
      s.原因摘要,
      s.情况判断?.商机阶段,
      s.情况判断?.报价状态,
      s.情况判断?.金额与方案,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
