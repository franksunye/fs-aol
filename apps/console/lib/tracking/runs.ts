import { db, ensureSchema, TABLE_ACTIONS, TABLE_LOGS, TABLE_TRACES } from "../db";
import { mapTraceToRun, parseTraceRunId } from "../adapters/run";
import type { MockRun, RunQuickFilter } from "../runs-mock";
import { mapTraceRow } from "./mappers";
import { parseJson, str } from "./parse";
import type { SuggestionDoc } from "./types";

export type RunsListQuery = {
  housekeeperId?: string;
  quick?: RunQuickFilter;
  agentId?: string;
  status?: string;
  model?: string;
  query?: string;
  page?: number;
  pageSize?: number;
};

type TraceListRow = {
  trace: ReturnType<typeof mapTraceRow>;
  dedupeKey: string;
  orderNum: string;
  eventType: string;
  housekeeperId: string;
  suggestion: SuggestionDoc;
  analysisRound: number;
};

async function loadTraceListRows(options: {
  housekeeperId?: string;
  limit: number;
  offset: number;
}): Promise<TraceListRow[]> {
  await ensureSchema();
  const hk = options.housekeeperId?.trim();
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (hk) {
    where.push("l.housekeeper_id = ?");
    args.push(hk);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const res = await db.execute({
    sql: `SELECT t.*, l.dedupe_key, l.order_num, l.event_type, l.housekeeper_id, l.suggestion,
                 (SELECT COUNT(*) FROM ${TABLE_TRACES} t2
                  WHERE t2.work_order_id = t.work_order_id AND t2.id <= t.id) AS analysis_round
          FROM ${TABLE_TRACES} t
          LEFT JOIN ${TABLE_LOGS} l ON l.work_order_id = t.work_order_id
          ${whereSql}
          ORDER BY t.created_at DESC
          LIMIT ? OFFSET ?`,
    args: [...args, options.limit, options.offset],
  });
  const rows = res.rows as unknown as Record<string, unknown>[];
  return rows.map((row) => ({
    trace: mapTraceRow(row, { includePrompts: false }),
    dedupeKey: str(row.dedupe_key),
    orderNum: str(row.order_num),
    eventType: str(row.event_type),
    housekeeperId: str(row.housekeeper_id),
    suggestion: parseJson<SuggestionDoc>(row.suggestion, {}),
    analysisRound: Number(row.analysis_round ?? 1),
  }));
}

function applyClientFilters(
  runs: MockRun[],
  filters: Omit<RunsListQuery, "page" | "pageSize" | "housekeeperId">
): MockRun[] {
  return runs.filter((item) => {
    if (filters.quick && filters.quick !== "all" && item.status !== filters.quick)
      return false;
    if (filters.agentId && filters.agentId !== "all" && item.agentId !== filters.agentId)
      return false;
    if (filters.status && filters.status !== "all" && item.status !== filters.status)
      return false;
    if (filters.model && filters.model !== "all" && item.model !== filters.model)
      return false;
    const q = filters.query?.trim().toLowerCase();
    if (q) {
      const hay = [
        item.id,
        item.agentName,
        item.relatedObjectId,
        item.triggerSource,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export async function listRunsPage(
  options: RunsListQuery
): Promise<{ runs: MockRun[]; total: number }> {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const pageSize = Math.min(Math.max(options.pageSize ?? 50, 1), 100);
  const hasFilters =
    (options.quick && options.quick !== "all") ||
    (options.agentId && options.agentId !== "all") ||
    (options.status && options.status !== "all") ||
    (options.model && options.model !== "all") ||
    Boolean(options.query?.trim());

  if (hasFilters) {
    const cap = 500;
    const rows = await loadTraceListRows({
      housekeeperId: options.housekeeperId,
      limit: cap,
      offset: 0,
    });
    const mapped = rows.map((r) =>
      mapTraceToRun({
        trace: r.trace,
        dedupeKey: r.dedupeKey,
        orderNum: r.orderNum,
        eventType: r.eventType,
        suggestion: r.suggestion,
        analysisRound: r.analysisRound,
      })
    );
    const filtered = applyClientFilters(mapped, options);
    const offset = (page - 1) * pageSize;
    return {
      runs: filtered.slice(offset, offset + pageSize),
      total: filtered.length,
    };
  }

  await ensureSchema();
  const hk = options.housekeeperId?.trim();
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (hk) {
    where.push("l.housekeeper_id = ?");
    args.push(hk);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countRes = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM ${TABLE_TRACES} t
          LEFT JOIN ${TABLE_LOGS} l ON l.work_order_id = t.work_order_id
          ${whereSql}`,
    args: [...args],
  });
  const total = Number((countRes.rows as { c?: number }[])[0]?.c ?? 0);
  const offset = (page - 1) * pageSize;
  const rows = await loadTraceListRows({
    housekeeperId: options.housekeeperId,
    limit: pageSize,
    offset,
  });
  const runs = rows.map((r) =>
    mapTraceToRun({
      trace: r.trace,
      dedupeKey: r.dedupeKey,
      orderNum: r.orderNum,
      eventType: r.eventType,
      suggestion: r.suggestion,
      analysisRound: r.analysisRound,
    })
  );
  return { runs, total };
}

export async function getRunById(runId: string): Promise<MockRun | null> {
  const traceId = parseTraceRunId(runId);
  if (traceId == null) return null;
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT t.*, l.dedupe_key, l.order_num, l.event_type, l.suggestion,
                 (SELECT COUNT(*) FROM ${TABLE_TRACES} t2
                  WHERE t2.work_order_id = t.work_order_id AND t2.id <= t.id) AS analysis_round
          FROM ${TABLE_TRACES} t
          LEFT JOIN ${TABLE_LOGS} l ON l.work_order_id = t.work_order_id
          WHERE t.id = ?
          LIMIT 1`,
    args: [traceId],
  });
  const row = (res.rows as unknown as Record<string, unknown>[])[0];
  if (!row) return null;
  const trace = mapTraceRow(row, { includePrompts: true });
  const dedupeKey = str(row.dedupe_key);
  const run = mapTraceToRun({
    trace,
    dedupeKey,
    orderNum: str(row.order_num),
    eventType: str(row.event_type),
    suggestion: parseJson<SuggestionDoc>(row.suggestion, trace.parsed ?? {}),
    analysisRound: Number(row.analysis_round ?? 1),
  });
  if (dedupeKey) {
    const actionRes = await db.execute({
      sql: `SELECT id FROM ${TABLE_ACTIONS} WHERE dedupe_key = ? ORDER BY id DESC LIMIT 1`,
      args: [dedupeKey],
    });
    const actionId = Number(
      (actionRes.rows as { id?: number }[])[0]?.id ?? NaN
    );
    if (Number.isFinite(actionId)) {
      run.actionDbId = actionId;
    }
  }
  return run;
}

export async function computeRunsSummaryFromDb(options?: {
  housekeeperId?: string;
}): Promise<{
  todayRuns: number;
  todayRunsDelta: number;
  success: number;
  successDelta: number;
  anomaly: number;
  anomalyDelta: number;
  avgDurationSec: number;
  avgDurationDelta: number;
}> {
  const { runs, total } = await listRunsPage({
    housekeeperId: options?.housekeeperId,
    page: 1,
    pageSize: 200,
  });
  const success = runs.filter((r) => r.status === "success").length;
  const anomaly = runs.filter((r) => r.status === "anomaly").length;
  const avg =
    runs.length > 0
      ? runs.reduce((s, r) => s + r.durationSec, 0) / runs.length
      : 0;
  const today = new Date().toISOString().slice(0, 10);
  const todayRuns = runs.filter((r) => {
    const d = r.startedAt;
    return d.includes(today.slice(5).replace("-", "/"));
  }).length;

  return {
    todayRuns: todayRuns || total,
    todayRunsDelta: 0,
    success,
    successDelta: 0,
    anomaly,
    anomalyDelta: 0,
    avgDurationSec: Math.round(avg * 10) / 10,
    avgDurationDelta: 0,
  };
}
