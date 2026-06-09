import type { SuggestionRow } from "./suggestions";

export type PriorityFilter = "all" | "高" | "中" | "低" | "pending";

const VALID: PriorityFilter[] = ["all", "高", "中", "低", "pending"];

export function parsePriorityFilter(raw?: string | null): PriorityFilter {
  return VALID.includes(raw as PriorityFilter) ? (raw as PriorityFilter) : "all";
}

export function filterByPriority(
  rows: SuggestionRow[],
  filter: PriorityFilter
): SuggestionRow[] {
  if (filter === "all") return rows;
  if (filter === "pending") {
    return rows.filter((r) => !r.outcome?.decision);
  }
  return rows.filter((r) => (r.suggestion.优先级 || "") === filter);
}
