import type { MockRun } from "./runs-mock";

export type RunSortKey =
  | "started"
  | "agent"
  | "status"
  | "duration"
  | "cost";

const ALL_KEYS: RunSortKey[] = [
  "started",
  "agent",
  "status",
  "duration",
  "cost",
];

const STATUS_RANK: Record<string, number> = {
  anomaly: 0,
  retried: 1,
  success: 2,
};

export function parseRunSortKey(raw?: string | null): RunSortKey {
  return (ALL_KEYS as string[]).includes(raw ?? "")
    ? (raw as RunSortKey)
    : "started";
}

export function sortRuns(
  items: MockRun[],
  sortKey: RunSortKey,
  order: "asc" | "desc"
): MockRun[] {
  const dir = order === "asc" ? 1 : -1;
  const next = [...items];

  next.sort((a, b) => {
    let cmp = 0;
    if (sortKey === "started") {
      cmp = a.startedAt.localeCompare(b.startedAt, "zh-CN");
    } else if (sortKey === "agent") {
      cmp = a.agentName.localeCompare(b.agentName, "zh-CN");
    } else if (sortKey === "status") {
      cmp =
        (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
    } else if (sortKey === "duration") {
      cmp = a.durationSec - b.durationSec;
    } else {
      cmp = a.costYuan - b.costYuan;
    }
    return cmp !== 0 ? cmp * dir : a.id.localeCompare(b.id);
  });

  return next;
}
