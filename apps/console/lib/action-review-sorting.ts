import type { Decision, SuggestionRow } from "./suggestions";
import type { PilotHousekeeper } from "./pilot-housekeepers";
import { housekeeperName, resolveExecutorLabel } from "./pilot-housekeepers";
import {
  actionInboxStatusLabel,
  FOLLOW_UP_SOURCE_AGENT,
} from "./action-list-display";

export type ActionReviewSortKey =
  | "latest"
  | "priority"
  | "housekeeper"
  | "disposition"
  | "related"
  | "agent";

const ALL_SORT_KEYS: ActionReviewSortKey[] = [
  "latest",
  "priority",
  "housekeeper",
  "disposition",
  "related",
  "agent",
];

const LEGACY_SORT_ALIASES: Record<string, ActionReviewSortKey> = {
  stage: "latest",
  quote: "latest",
  stale: "latest",
  part: "latest",
};

const PRIORITY_RANK: Record<string, number> = { 高: 0, 中: 1, 低: 2 };
const DECISION_RANK: Record<Decision, number> = {
  approved: 0,
  modified: 1,
  followed_up: 2,
  rejected: 3,
};

function rankDecision(v?: Decision | null): number {
  return v ? DECISION_RANK[v] ?? 9 : 8;
}

function processedMs(row: SuggestionRow): number {
  const t = new Date(row.processedAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

function cmpLatest(a: SuggestionRow, b: SuggestionRow): number {
  return processedMs(b) - processedMs(a);
}

function cmpText(a: string, b: string): number {
  return a.localeCompare(b, "zh-CN");
}

function relatedObjectId(row: SuggestionRow): string {
  return row.orderNum || row.workOrderId;
}

export function parseActionReviewSortKey(raw?: string | null): ActionReviewSortKey {
  const legacy = LEGACY_SORT_ALIASES[raw ?? ""];
  if (legacy) return legacy;
  return (ALL_SORT_KEYS as string[]).includes(raw ?? "")
    ? (raw as ActionReviewSortKey)
    : "latest";
}

export function sortActionReviews(
  rows: SuggestionRow[],
  sortKey: ActionReviewSortKey,
  pilots: PilotHousekeeper[]
): SuggestionRow[] {
  const next = [...rows];
  next.sort((a, b) => {
    if (sortKey === "related") {
      const c = cmpText(relatedObjectId(a), relatedObjectId(b));
      return c !== 0 ? c : cmpLatest(a, b);
    }
    if (sortKey === "agent") {
      const c = cmpText(FOLLOW_UP_SOURCE_AGENT.label, FOLLOW_UP_SOURCE_AGENT.label);
      if (c !== 0) return c;
      return cmpLatest(a, b);
    }
    if (sortKey === "housekeeper") {
      const na = resolveExecutorLabel(pilots, a);
      const nb = resolveExecutorLabel(pilots, b);
      const c = cmpText(na, nb);
      return c !== 0 ? c : cmpLatest(a, b);
    }
    if (sortKey === "priority") {
      const pa = PRIORITY_RANK[a.suggestion.优先级 ?? ""] ?? 9;
      const pb = PRIORITY_RANK[b.suggestion.优先级 ?? ""] ?? 9;
      if (pa !== pb) return pa - pb;
      return cmpLatest(a, b);
    }
    if (sortKey === "disposition") {
      const da = rankDecision(a.outcome?.decision ?? null);
      const db = rankDecision(b.outcome?.decision ?? null);
      if (da !== db) return da - db;
      const sa = cmpText(actionInboxStatusLabel(a), actionInboxStatusLabel(b));
      if (sa !== 0) return sa;
      return cmpLatest(a, b);
    }
    return cmpLatest(a, b);
  });
  return next;
}
