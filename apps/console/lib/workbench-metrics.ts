import type { SuggestionDoc, SuggestionRow } from "./suggestions";
import { computeStats, type DashboardStats } from "./suggestions";

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

export function formatYuanCompact(n: number): string {
  if (n >= 10_000) {
    const wan = n / 10_000;
    return wan >= 100
      ? `¥${Math.round(n).toLocaleString("zh-CN")}`
      : `¥${wan % 1 === 0 ? wan : wan.toFixed(1)}万`;
  }
  return `¥${Math.round(n).toLocaleString("zh-CN")}`;
}

const PRIORITY_IMPACT: Record<string, number> = {
  高: 0.31,
  中: 0.22,
  低: 0.15,
};

function windowBounds(): { todayStart: number; yesterdayStart: number; yesterdayEnd: number } {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  return {
    todayStart: todayStart.getTime(),
    yesterdayStart: yesterdayStart.getTime(),
    yesterdayEnd: todayStart.getTime(),
  };
}

function processedMs(row: SuggestionRow): number | null {
  if (!row.processedAt?.trim()) return null;
  const t = new Date(row.processedAt).getTime();
  return Number.isNaN(t) ? null : t;
}

function rowsInWindow(
  rows: SuggestionRow[],
  startMs: number,
  endMs: number
): SuggestionRow[] {
  return rows.filter((r) => {
    const t = processedMs(r);
    return t != null && t >= startMs && t < endMs;
  });
}

function sumQuoteAmount(rows: SuggestionRow[]): number {
  return rows.reduce((sum, r) => {
    const amt = parseQuoteAmountYuan(r.suggestion);
    return sum + (amt ?? 0);
  }, 0);
}

function avgImpactPct(rows: SuggestionRow[]): number {
  const pending = rows.filter((r) => !r.outcome && r.suggestion.需要跟进 !== false);
  if (pending.length === 0) return 0;
  const total = pending.reduce((sum, r) => {
    const p = r.suggestion.优先级 || "中";
    return sum + (PRIORITY_IMPACT[p] ?? 0.18);
  }, 0);
  return Math.round((total / pending.length) * 100);
}

export interface WorkbenchMetricCards {
  base: DashboardStats;
  pending: number;
  pendingDelta: number | null;
  pushableAmount: number;
  amountDelta: number | null;
  highPriority: number;
  highPriorityShare: number;
  estimatedImpactPct: number;
  impactDelta: number | null;
}

export function computeWorkbenchMetricCards(
  rows: SuggestionRow[]
): WorkbenchMetricCards {
  const base = computeStats(rows);
  const pendingRows = rows.filter(
    (r) => !r.outcome && r.suggestion.需要跟进 !== false
  );
  const { todayStart, yesterdayStart, yesterdayEnd } = windowBounds();

  const todayNew = rowsInWindow(pendingRows, todayStart, Date.now()).length;
  const yesterdayNew = rowsInWindow(
    pendingRows,
    yesterdayStart,
    yesterdayEnd
  ).length;
  const pendingDelta =
    todayNew > 0 || yesterdayNew > 0 ? todayNew - yesterdayNew : null;

  const pushableAmount = sumQuoteAmount(pendingRows);
  const todayAmount = sumQuoteAmount(
    rowsInWindow(pendingRows, todayStart, Date.now())
  );
  const yesterdayAmount = sumQuoteAmount(
    rowsInWindow(pendingRows, yesterdayStart, yesterdayEnd)
  );
  const amountDelta =
    todayAmount > 0 || yesterdayAmount > 0
      ? todayAmount - yesterdayAmount
      : null;

  const high = base.byPriority["高"] ?? 0;
  const highPriorityShare = pendingRows.length
    ? Math.round((high / pendingRows.length) * 100)
    : 0;

  const estimatedImpactPct = avgImpactPct(rows);
  const todayImpact = avgImpactPct(
    rowsInWindow(pendingRows, todayStart, Date.now())
  );
  const yesterdayImpact = avgImpactPct(
    rowsInWindow(pendingRows, yesterdayStart, yesterdayEnd)
  );
  const impactDelta =
    todayImpact > 0 || yesterdayImpact > 0
      ? todayImpact - yesterdayImpact
      : null;

  return {
    base,
    pending: base.pending,
    pendingDelta,
    pushableAmount,
    amountDelta,
    highPriority: high,
    highPriorityShare,
    estimatedImpactPct,
    impactDelta,
  };
}
