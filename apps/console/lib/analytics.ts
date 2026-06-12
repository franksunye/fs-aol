import { db, ensureSchema, TABLE_ACTIONS, TABLE_LOGS, TABLE_TRACES } from "./db";
import {
  aggregateLogsPeriod,
  aggregateOutcomesPeriod,
} from "./tracking/analytics-read";

export type AnalyticsRangeKey =
  | "week"
  | "last_week"
  | "month"
  | "last_7"
  | "last_30";

const PRIORITY_ORDER = ["高", "中", "低"] as const;
const PRIORITY_COLORS: Record<string, string> = {
  高: "#ef4444",
  中: "#f59e0b",
  低: "#3b82f6",
};

export interface DateRangeWindow {
  key: AnalyticsRangeKey;
  label: string;
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
}

export interface AnalyticsTrendPoint {
  date: string;
  label: string;
  discovered: number;
  actions: number;
}

export interface AnalyticsPrioritySlice {
  key: string;
  label: string;
  count: number;
  color: string;
  percent: number;
}

export interface OutcomeBreakdown {
  approved: number;
  modified: number;
  rejected: number;
  followed_up: number;
  prevApproved: number;
  prevModified: number;
  prevRejected: number;
  prevFollowedUp: number;
}

export interface ActionCompletionMetrics {
  total: number;
  completed: number;
  pending: number;
  timeout: number;
  prevTotal: number;
  prevCompleted: number;
}

export interface TraceCostAggregate {
  runCount: number;
  totalTokens: number;
  avgLatencyMs: number;
  prevRunCount: number;
  prevTotalTokens: number;
  prevAvgLatencyMs: number;
}

export interface AnalyticsSnapshot {
  range: DateRangeWindow;
  discovered: number;
  actions: number;
  successRate: number;
  drivenAmount: number;
  avgStaleDays: number | null;
  prevDiscovered: number;
  prevActions: number;
  prevDrivenAmount: number;
  prevAvgStaleDays: number | null;
  trend: AnalyticsTrendPoint[];
  priorityDistribution: AnalyticsPrioritySlice[];
  outcomeBreakdown: OutcomeBreakdown;
  actionCompletion: ActionCompletionMetrics;
  traceCost: TraceCostAggregate;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function mondayWeekStart(d: Date): Date {
  const day = startOfDay(d);
  const weekday = day.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  return addDays(day, diff);
}

function formatMd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}/${day}`;
}

function formatRangeLabel(start: Date, end: Date): string {
  const last = addDays(end, -1);
  return `${formatMd(start)}-${formatMd(last)}`;
}

export function parseAnalyticsRangeKey(
  value?: string | null
): AnalyticsRangeKey {
  const v = value?.trim();
  if (
    v === "week" ||
    v === "last_week" ||
    v === "month" ||
    v === "last_7" ||
    v === "last_30"
  ) {
    return v;
  }
  return "week";
}

export function resolveDateRange(
  key: AnalyticsRangeKey,
  now = new Date()
): DateRangeWindow {
  const today = startOfDay(now);

  if (key === "week") {
    const start = mondayWeekStart(today);
    const end = addDays(start, 7);
    const prevEnd = start;
    const prevStart = addDays(prevEnd, -7);
    return {
      key,
      label: `本周 (${formatRangeLabel(start, end)})`,
      start,
      end,
      prevStart,
      prevEnd,
    };
  }

  if (key === "last_week") {
    const thisWeekStart = mondayWeekStart(today);
    const end = thisWeekStart;
    const start = addDays(end, -7);
    const prevEnd = start;
    const prevStart = addDays(prevEnd, -7);
    return {
      key,
      label: `上周 (${formatRangeLabel(start, end)})`,
      start,
      end,
      prevStart,
      prevEnd,
    };
  }

  if (key === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const prevEnd = start;
    const prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return {
      key,
      label: `本月 (${formatRangeLabel(start, end)})`,
      start,
      end,
      prevStart,
      prevEnd,
    };
  }

  if (key === "last_7") {
    const end = addDays(today, 1);
    const start = addDays(today, -6);
    const prevEnd = start;
    const prevStart = addDays(prevEnd, -7);
    return {
      key,
      label: `近 7 天 (${formatRangeLabel(start, end)})`,
      start,
      end,
      prevStart,
      prevEnd,
    };
  }

  const end = addDays(today, 1);
  const start = addDays(today, -29);
  const prevEnd = start;
  const prevStart = addDays(prevEnd, -30);
  return {
    key: "last_30",
    label: `近 30 天 (${formatRangeLabel(start, end)})`,
    start,
    end,
    prevStart,
    prevEnd,
  };
}

function toIso(d: Date): string {
  return d.toISOString();
}

function str(value: unknown): string {
  return value == null ? "" : String(value);
}

function buildDayBuckets(start: Date, end: Date): AnalyticsTrendPoint[] {
  const buckets: AnalyticsTrendPoint[] = [];
  let cursor = startOfDay(start);
  const limit = startOfDay(end);
  while (cursor < limit) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const date = `${y}-${m}-${d}`;
    buckets.push({
      date,
      label: formatMd(cursor),
      discovered: 0,
      actions: 0,
    });
    cursor = addDays(cursor, 1);
  }
  return buckets;
}

function buildTrend(
  range: DateRangeWindow,
  logs: Awaited<ReturnType<typeof aggregateLogsPeriod>>,
  outcomes: Awaited<ReturnType<typeof aggregateOutcomesPeriod>>
): AnalyticsTrendPoint[] {
  const buckets = buildDayBuckets(range.start, range.end);
  return buckets.map((b) => ({
    ...b,
    discovered: logs.trendDiscovered.get(b.date) ?? 0,
    actions: outcomes.trendActions.get(b.date) ?? 0,
  }));
}

function buildPriorityDistribution(
  byPriority: Record<string, number>
): AnalyticsPrioritySlice[] {
  const orderedKeys = [
    ...PRIORITY_ORDER.filter((k) => (byPriority[k] ?? 0) > 0),
    ...Object.keys(byPriority).filter(
      (k) => !PRIORITY_ORDER.includes(k as (typeof PRIORITY_ORDER)[number])
    ),
  ];
  const total = orderedKeys.reduce((sum, k) => sum + (byPriority[k] ?? 0), 0);
  return orderedKeys.map((key) => {
    const count = byPriority[key] ?? 0;
    return {
      key,
      label: key === "未定" ? "未定优先级" : `${key}优先级`,
      count,
      color: PRIORITY_COLORS[key] ?? "#94a3b8",
      percent: total ? Math.round((count / total) * 100) : 0,
    };
  });
}

export async function loadAnalyticsSnapshot(options?: {
  rangeKey?: AnalyticsRangeKey;
  housekeeperId?: string;
}): Promise<AnalyticsSnapshot> {
  const range = resolveDateRange(
    parseAnalyticsRangeKey(options?.rangeKey)
  );
  const hk = options?.housekeeperId?.trim();

  const [currentLogs, prevLogs, currentOutcomes, prevOutcomes] =
    await Promise.all([
      aggregateLogsPeriod(range.start, range.end, hk),
      aggregateLogsPeriod(range.prevStart, range.prevEnd, hk),
      aggregateOutcomesPeriod(range.start, range.end, hk),
      aggregateOutcomesPeriod(range.prevStart, range.prevEnd, hk),
    ]);

  const [actionCompletion, traceCost] = await Promise.all([
    loadActionCompletionMetrics(range, hk),
    loadTraceCostAggregate(range, hk),
  ]);

  const outcomeBreakdown: OutcomeBreakdown = {
    approved: currentOutcomes.breakdown.approved,
    modified: currentOutcomes.breakdown.modified,
    rejected: currentOutcomes.breakdown.rejected,
    followed_up: currentOutcomes.breakdown.followed_up,
    prevApproved: prevOutcomes.breakdown.approved,
    prevModified: prevOutcomes.breakdown.modified,
    prevRejected: prevOutcomes.breakdown.rejected,
    prevFollowedUp: prevOutcomes.breakdown.followed_up,
  };

  return {
    range,
    discovered: currentLogs.discovered,
    actions: currentOutcomes.actions,
    successRate: currentLogs.discovered
      ? Math.round((currentOutcomes.actions / currentLogs.discovered) * 100)
      : 0,
    drivenAmount: currentOutcomes.drivenAmount,
    avgStaleDays: currentLogs.avgStaleDays,
    prevDiscovered: prevLogs.discovered,
    prevActions: prevOutcomes.actions,
    prevDrivenAmount: prevOutcomes.drivenAmount,
    prevAvgStaleDays: prevLogs.avgStaleDays,
    trend: buildTrend(range, currentLogs, currentOutcomes),
    priorityDistribution: buildPriorityDistribution(currentLogs.byPriority),
    outcomeBreakdown,
    actionCompletion,
    traceCost,
  };
}

export async function loadOutcomeBreakdown(
  range: DateRangeWindow,
  housekeeperId?: string
): Promise<OutcomeBreakdown> {
  const [current, prev] = await Promise.all([
    aggregateOutcomesPeriod(range.start, range.end, housekeeperId),
    aggregateOutcomesPeriod(range.prevStart, range.prevEnd, housekeeperId),
  ]);
  return {
    approved: current.breakdown.approved,
    modified: current.breakdown.modified,
    rejected: current.breakdown.rejected,
    followed_up: current.breakdown.followed_up,
    prevApproved: prev.breakdown.approved,
    prevModified: prev.breakdown.modified,
    prevRejected: prev.breakdown.rejected,
    prevFollowedUp: prev.breakdown.followed_up,
  };
}

export async function loadActionCompletionMetrics(
  range: DateRangeWindow,
  housekeeperId?: string
): Promise<ActionCompletionMetrics> {
  await ensureSchema();
  async function periodMetrics(start: Date, end: Date) {
    const where = ["created_at >= ?", "created_at < ?"];
    const args: (string | number)[] = [toIso(start), toIso(end)];
    if (housekeeperId?.trim()) {
      where.push("assignee_id = ?");
      args.push(housekeeperId.trim());
    }
    const res = await db.execute({
      sql: `SELECT status, COUNT(*) AS c FROM ${TABLE_ACTIONS}
            WHERE ${where.join(" AND ")}
            GROUP BY status`,
      args,
    });
    let total = 0;
    let completed = 0;
    let pending = 0;
    let timeout = 0;
    for (const row of res.rows as unknown as Record<string, unknown>[]) {
      const status = str(row.status);
      const c = Number(row.c ?? 0);
      total += c;
      if (status === "completed") completed += c;
      else if (status === "pending_dispatch" || status === "in_progress" || status === "dispatched")
        pending += c;
      else if (status === "timeout" || status === "no_feedback") timeout += c;
    }
    return { total, completed, pending, timeout };
  }
  const [current, prev] = await Promise.all([
    periodMetrics(range.start, range.end),
    periodMetrics(range.prevStart, range.prevEnd),
  ]);
  return {
    ...current,
    prevTotal: prev.total,
    prevCompleted: prev.completed,
  };
}

export async function loadTraceCostAggregate(
  range: DateRangeWindow,
  housekeeperId?: string
): Promise<TraceCostAggregate> {
  await ensureSchema();
  async function periodAgg(start: Date, end: Date) {
    const where = ["t.created_at >= ?", "t.created_at < ?"];
    const args: (string | number)[] = [toIso(start), toIso(end)];
    if (housekeeperId?.trim()) {
      where.push("l.housekeeper_id = ?");
      args.push(housekeeperId.trim());
    }
    const fromClause = housekeeperId?.trim()
      ? `FROM ${TABLE_TRACES} t INNER JOIN ${TABLE_LOGS} l ON l.work_order_id = t.work_order_id`
      : `FROM ${TABLE_TRACES} t`;
    const res = await db.execute({
      sql: `SELECT COUNT(*) AS runs,
                   COALESCE(SUM(t.total_tokens), 0) AS tokens,
                   COALESCE(AVG(t.latency_ms), 0) AS avg_latency
            ${fromClause}
            WHERE ${where.join(" AND ")}`,
      args,
    });
    const row = (res.rows[0] ?? {}) as Record<string, unknown>;
    return {
      runCount: Number(row.runs ?? 0),
      totalTokens: Number(row.tokens ?? 0),
      avgLatencyMs: Math.round(Number(row.avg_latency ?? 0)),
    };
  }
  const [current, prev] = await Promise.all([
    periodAgg(range.start, range.end),
    periodAgg(range.prevStart, range.prevEnd),
  ]);
  return {
    ...current,
    prevRunCount: prev.runCount,
    prevTotalTokens: prev.totalTokens,
    prevAvgLatencyMs: prev.avgLatencyMs,
  };
}

export function formatDeltaPercent(
  current: number,
  previous: number
): { text: string; tone: "up" | "down" | "flat" | "na" } {
  if (previous === 0) {
    if (current === 0) return { text: "与上期持平", tone: "flat" };
    return { text: "上期无数据", tone: "na" };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { text: "与上期持平", tone: "flat" };
  const arrow = pct > 0 ? "↑" : "↓";
  return {
    text: `较上期 ${arrow}${Math.abs(pct)}%`,
    tone: pct > 0 ? "up" : "down",
  };
}

export function formatStaleDelta(
  current: number | null,
  previous: number | null
): { text: string; tone: "up" | "down" | "flat" | "na" } {
  if (current == null || previous == null) {
    return { text: "暂无滞留快照", tone: "na" };
  }
  const delta = Math.round((current - previous) * 10) / 10;
  if (delta === 0) return { text: "与上期持平", tone: "flat" };
  const arrow = delta > 0 ? "↑" : "↓";
  return {
    text: `较上期 ${arrow}${Math.abs(delta)} 天`,
    tone: delta > 0 ? "up" : "down",
  };
}
