import type { ExecutionAction } from "./action-execution-mock";
import { calendarPriorityLabel } from "./action-list-display";

export type ExecutionSortKey =
  | "due"
  | "priority"
  | "status"
  | "agent"
  | "title";

const ALL_KEYS: ExecutionSortKey[] = [
  "due",
  "priority",
  "status",
  "agent",
  "title",
];

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function parseExecutionSortKey(
  raw?: string | null
): ExecutionSortKey {
  return (ALL_KEYS as string[]).includes(raw ?? "")
    ? (raw as ExecutionSortKey)
    : "due";
}

export function sortExecutionActions(
  items: ExecutionAction[],
  sortKey: ExecutionSortKey,
  order: "asc" | "desc"
): ExecutionAction[] {
  const dir = order === "asc" ? 1 : -1;
  const next = [...items];

  next.sort((a, b) => {
    let cmp = 0;
    if (sortKey === "due") {
      const da = `${a.dueDate}T${a.dueTime ?? "00:00"}`;
      const db = `${b.dueDate}T${b.dueTime ?? "00:00"}`;
      cmp = da.localeCompare(db);
    } else if (sortKey === "priority") {
      cmp =
        (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
    } else if (sortKey === "status") {
      cmp = a.status.localeCompare(b.status, "zh-CN");
    } else if (sortKey === "agent") {
      cmp = a.sourceAgent.localeCompare(b.sourceAgent, "zh-CN");
    } else {
      cmp = a.title.localeCompare(b.title, "zh-CN");
    }
    return cmp !== 0 ? cmp * dir : a.id.localeCompare(b.id);
  });

  return next;
}

export function executionPriorityLabel(item: ExecutionAction): string {
  return calendarPriorityLabel(item.priority);
}
