import { TABLE_LOGS, TABLE_TRACES } from "../db";
import { query, scalarNumber, firstRow } from "../data/client";

export type RunsSummaryAggregate = {
  total: number;
  success: number;
  anomaly: number;
  avgDurationSec: number;
  todayRuns: number;
};

function hkClause(
  housekeeperId?: string
): { clause: string; args: string[] } {
  const hk = housekeeperId?.trim();
  if (!hk) return { clause: "", args: [] };
  return { clause: " AND l.housekeeper_id = ?", args: [hk] };
}

/** Runs 页 KPI：SQL 聚合，避免拉 200 条后在 JS 统计。 */
export async function aggregateRunsSummary(
  housekeeperId?: string
): Promise<RunsSummaryAggregate> {
  const hk = hkClause(housekeeperId);
  const fromClause = `FROM ${TABLE_TRACES} t
    LEFT JOIN ${TABLE_LOGS} l ON l.work_order_id = t.work_order_id
    WHERE 1=1${hk.clause}`;
  const res = await query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE
         WHEN x.status = 'ok' AND COALESCE(x.error, '') = '' AND x.analysis_round = 1
         THEN 1 ELSE 0 END) AS success,
       SUM(CASE
         WHEN x.status != 'ok' OR COALESCE(x.error, '') != ''
         THEN 1 ELSE 0 END) AS anomaly,
       COALESCE(AVG(x.latency_ms), 0) AS avg_latency_ms,
       SUM(CASE WHEN date(x.created_at) = date('now') THEN 1 ELSE 0 END) AS today_runs
     FROM (
       SELECT t.status, t.error, t.latency_ms, t.created_at,
              ROW_NUMBER() OVER (PARTITION BY t.work_order_id ORDER BY t.id) AS analysis_round
       ${fromClause}
     ) x`,
    hk.args
  );
  const row = firstRow<Record<string, unknown>>(res);
  return {
    total: Number(row?.total ?? 0),
    success: Number(row?.success ?? 0),
    anomaly: Number(row?.anomaly ?? 0),
    avgDurationSec:
      Math.round((Number(row?.avg_latency_ms ?? 0) / 1000) * 10) / 10,
    todayRuns: Number(row?.today_runs ?? 0),
  };
}

export function traceListFromClause(housekeeperId?: string): {
  sql: string;
  args: string[];
} {
  const hk = hkClause(housekeeperId);
  return {
    sql: `FROM ${TABLE_TRACES} t
          LEFT JOIN ${TABLE_LOGS} l ON l.work_order_id = t.work_order_id
          WHERE 1=1${hk.clause}`,
    args: hk.args,
  };
}

export async function countTracesForRuns(
  housekeeperId?: string
): Promise<number> {
  const { sql, args } = traceListFromClause(housekeeperId);
  const res = await query(`SELECT COUNT(*) AS c ${sql}`, args);
  return scalarNumber(res);
}
