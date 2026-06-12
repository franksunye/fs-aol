import type { SuggestionRow } from "./suggestions";
import { computeStats, type DashboardStats } from "./suggestions";
import { formatYuanCompact } from "./format-yuan";
import { parseQuoteAmountYuan } from "./parse-quote-amount";

export { formatYuanCompact, parseQuoteAmountYuan };

function processedMs(row: SuggestionRow): number | null {
  if (!row.processedAt?.trim()) return null;
  const t = new Date(row.processedAt).getTime();
  return Number.isNaN(t) ? null : t;
}

function countProcessedSince(rows: SuggestionRow[], sinceMs: number): number {
  return rows.filter((r) => {
    const t = processedMs(r);
    return t != null && t >= sinceMs;
  }).length;
}

export interface ActionReviewMetricCards {
  base: DashboardStats;
  /** 未 disposition 的待处理数 */
  pending: number;
  /** 今日 Agent 新进池（按 processed_at，非业务滞留变化） */
  todayNewInPool: number;
  /** 待处理中含可解析报价的条数 */
  quotedCount: number;
  pushableAmount: number;
  highPriority: number;
  highPriorityShare: number;
}

export function computeActionReviewMetricCards(
  rows: SuggestionRow[]
): ActionReviewMetricCards {
  const base = computeStats(rows);
  const pendingRows = rows.filter(
    (r) => !r.outcome && r.suggestion.需要跟进 !== false
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let pushableAmount = 0;
  let quotedCount = 0;
  for (const r of pendingRows) {
    const amt = parseQuoteAmountYuan(r.suggestion);
    if (amt != null) {
      pushableAmount += amt;
      quotedCount += 1;
    }
  }

  const high = base.byPriority["高"] ?? 0;
  const highPriorityShare = pendingRows.length
    ? Math.round((high / pendingRows.length) * 100)
    : 0;

  return {
    base,
    pending: base.pending,
    todayNewInPool: countProcessedSince(pendingRows, todayStart.getTime()),
    quotedCount,
    pushableAmount,
    highPriority: high,
    highPriorityShare,
  };
}
