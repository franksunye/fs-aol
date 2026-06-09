import { db, ensureSchema, TABLE_LOGS, TABLE_OUTCOMES } from "./db";
import type { Decision, SuggestionDoc, SuggestionRow } from "./suggestions";
import { parseQuoteAmountYuan } from "./workbench-metrics";

export type AnalyticsRangeKey =
  | "week"
  | "last_week"
  | "month"
  | "last_7"
  | "last_30";

const ACTION_DECISIONS: Decision[] = ["approved", "modified", "followed_up"];

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

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function str(value: unknown): string {
  return value == null ? "" : String(value);
}

function needsFollow(s: SuggestionDoc): boolean {
  return s.需要跟进 !== false;
}

function staleAtAnalysis(row: {
  analyzedStaleDays: number | null;
}): number | null {
  if (
    row.analyzedStaleDays != null &&
    Number.isFinite(row.analyzedStaleDays) &&
    row.analyzedStaleDays >= 0
  ) {
    return row.analyzedStaleDays;
  }
  return null;
}

async function fetchLogsBetween(
  start: Date,
  end: Date,
  housekeeperId?: string
): Promise<SuggestionRow[]> {
  await ensureSchema();
  const where = ["processed_at >= ?", "processed_at < ?"];
  const args: (string | number)[] = [toIso(start), toIso(end)];
  if (housekeeperId?.trim()) {
    where.push("housekeeper_id = ?");
    args.push(housekeeperId.trim());
  }
  const res = await db.execute({
    sql: `SELECT * FROM ${TABLE_LOGS} WHERE ${where.join(
      " AND "
    )} ORDER BY processed_at ASC LIMIT 5000`,
    args,
  });
  return (res.rows as unknown as Record<string, unknown>[]).map((row) => ({
    dedupeKey: str(row.dedupe_key),
    workOrderId: str(row.work_order_id),
    eventType: str(row.event_type),
    orderNum: str(row.order_num),
    city: str(row.city),
    housekeeperId: str(row.housekeeper_id),
    status: str(row.status),
    processedAt: str(row.processed_at),
    stateAt: str(row.state_at).trim() || null,
    suggestion: parseJson<SuggestionDoc>(row.suggestion, {}),
    outcome: null,
    blocker: null,
    inboxBucket: "active" as const,
    archiveReason: str(row.archive_reason),
    reconciledAt: str(row.reconciled_at).trim() || null,
    mongoStatus: str(row.mongo_status),
    liveVerdict: str(row.live_verdict),
    analyzedStaleDays:
      row.analyzed_stale_days != null &&
      String(row.analyzed_stale_days).trim() !== ""
        ? Number(row.analyzed_stale_days)
        : null,
  }));
}

interface OutcomeInRange {
  decision: Decision;
  createdAt: string;
  suggestion: SuggestionDoc;
}

async function fetchOutcomesBetween(
  start: Date,
  end: Date,
  housekeeperId?: string
): Promise<OutcomeInRange[]> {
  await ensureSchema();
  const where = ["o.created_at >= ?", "o.created_at < ?"];
  const args: (string | number)[] = [toIso(start), toIso(end)];
  if (housekeeperId?.trim()) {
    where.push("l.housekeeper_id = ?");
    args.push(housekeeperId.trim());
  }
  const res = await db.execute({
    sql: `SELECT o.decision, o.created_at, l.suggestion
          FROM ${TABLE_OUTCOMES} o
          INNER JOIN ${TABLE_LOGS} l ON l.dedupe_key = o.dedupe_key
          WHERE ${where.join(" AND ")}
          ORDER BY o.created_at ASC
          LIMIT 5000`,
    args,
  });
  return (res.rows as unknown as Record<string, unknown>[]).map((row) => ({
    decision: str(row.decision) as Decision,
    createdAt: str(row.created_at),
    suggestion: parseJson<SuggestionDoc>(row.suggestion, {}),
  }));
}

function dayKey(iso: string): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

interface PeriodMetrics {
  discovered: number;
  actions: number;
  drivenAmount: number;
  avgStaleDays: number | null;
  byPriority: Record<string, number>;
  trendDiscovered: Map<string, number>;
  trendActions: Map<string, number>;
}

function computePeriodMetrics(
  logs: SuggestionRow[],
  outcomes: OutcomeInRange[],
  rangeStart: Date,
  rangeEnd: Date
): PeriodMetrics {
  const followLogs = logs.filter((r) => needsFollow(r.suggestion));
  const byPriority: Record<string, number> = {};
  const staleValues: number[] = [];
  const trendDiscovered = new Map<string, number>();
  const trendActions = new Map<string, number>();

  for (const row of followLogs) {
    const p = row.suggestion.优先级 || "未定";
    byPriority[p] = (byPriority[p] ?? 0) + 1;
    const stale = staleAtAnalysis(row);
    if (stale != null) staleValues.push(stale);
    const dk = dayKey(row.processedAt);
    if (dk) trendDiscovered.set(dk, (trendDiscovered.get(dk) ?? 0) + 1);
  }

  let actions = 0;
  let drivenAmount = 0;
  for (const o of outcomes) {
    if (!ACTION_DECISIONS.includes(o.decision)) continue;
    actions += 1;
    const amt = parseQuoteAmountYuan(o.suggestion);
    if (amt != null) drivenAmount += amt;
    const dk = dayKey(o.createdAt);
    if (dk) trendActions.set(dk, (trendActions.get(dk) ?? 0) + 1);
  }

  const avgStaleDays =
    staleValues.length > 0
      ? Math.round((staleValues.reduce((a, b) => a + b, 0) / staleValues.length) * 10) /
        10
      : null;

  void rangeStart;
  void rangeEnd;

  return {
    discovered: followLogs.length,
    actions,
    drivenAmount,
    avgStaleDays,
    byPriority,
    trendDiscovered,
    trendActions,
  };
}

function buildTrend(
  range: DateRangeWindow,
  metrics: PeriodMetrics
): AnalyticsTrendPoint[] {
  const buckets = buildDayBuckets(range.start, range.end);
  return buckets.map((b) => ({
    ...b,
    discovered: metrics.trendDiscovered.get(b.date) ?? 0,
    actions: metrics.trendActions.get(b.date) ?? 0,
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
      fetchLogsBetween(range.start, range.end, hk),
      fetchLogsBetween(range.prevStart, range.prevEnd, hk),
      fetchOutcomesBetween(range.start, range.end, hk),
      fetchOutcomesBetween(range.prevStart, range.prevEnd, hk),
    ]);

  const current = computePeriodMetrics(
    currentLogs,
    currentOutcomes,
    range.start,
    range.end
  );
  const prev = computePeriodMetrics(
    prevLogs,
    prevOutcomes,
    range.prevStart,
    range.prevEnd
  );

  return {
    range,
    discovered: current.discovered,
    actions: current.actions,
    successRate: current.discovered
      ? Math.round((current.actions / current.discovered) * 100)
      : 0,
    drivenAmount: current.drivenAmount,
    avgStaleDays: current.avgStaleDays,
    prevDiscovered: prev.discovered,
    prevActions: prev.actions,
    prevDrivenAmount: prev.drivenAmount,
    prevAvgStaleDays: prev.avgStaleDays,
    trend: buildTrend(range, current),
    priorityDistribution: buildPriorityDistribution(current.byPriority),
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
