import type { DataListLayout } from "./data-list-types";

/** PUB-17 secondary columns hidden in narrow / split layout */
export const NARROW_HIDDEN_COLUMN_IDS = new Set([
  "sourceAgent",
  "sourceSystem",
  "executor",
  "related",
  "context",
  "status",
  "time",
  "due",
  "terminalFeedback",
]);

export function isColumnVisibleInLayout(
  columnId: string,
  layout: DataListLayout
): boolean {
  if (layout === "wide") return true;
  return !NARROW_HIDDEN_COLUMN_IDS.has(columnId);
}
