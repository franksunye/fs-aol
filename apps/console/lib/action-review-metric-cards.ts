import type { SuggestionDoc, SuggestionRow } from "./suggestions";
import { computeStats, type DashboardStats } from "./suggestions";
import { formatYuanCompact } from "./format-yuan";

export { formatYuanCompact };

/** 从 Action Spec 金额与方案字段解析报价金额（元） */
export function parseQuoteAmountYuan(s: SuggestionDoc): number | null {
  const raw = s.情况判断?.金额与方案?.trim();
  if (!raw) return null;
  const m =
    raw.match(/(?:¥|￥)\s*([\d,]+(?:\.\d+)?)/) ??
    raw.match(/([\d,]+(?:\.\d+)?)\s*元/) ??
    raw.match(/^([\d,]+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

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
