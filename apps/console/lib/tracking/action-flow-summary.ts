import { cache } from "react";
import { db, ensureSchema, TABLE_ACTIONS } from "../db";

export type ActionFlowSummary = {
  pendingDispatch: number;
  dispatched: number;
  inProgress: number;
  withFeedback: number;
  timeoutAnomaly: number;
};

const EMPTY_FLOW: ActionFlowSummary = {
  pendingDispatch: 0,
  dispatched: 0,
  inProgress: 0,
  withFeedback: 0,
  timeoutAnomaly: 0,
};

async function summarizeActionFlowUncached(
  housekeeperId?: string
): Promise<ActionFlowSummary> {
  await ensureSchema();
  const hk = housekeeperId?.trim();
  const where: string[] = [];
  const args: string[] = [];
  if (hk) {
    where.push("assignee_id = ?");
    args.push(hk);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const res = await db.execute({
    sql: `SELECT
            SUM(CASE WHEN status = 'pending_dispatch' THEN 1 ELSE 0 END) AS pending_dispatch,
            SUM(CASE WHEN status = 'dispatched' THEN 1 ELSE 0 END) AS dispatched,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
            SUM(CASE WHEN terminal_feedback IS NOT NULL AND terminal_feedback != '' THEN 1 ELSE 0 END) AS with_feedback,
            SUM(CASE WHEN status IN ('timeout', 'no_feedback') THEN 1 ELSE 0 END) AS timeout_anomaly
          FROM ${TABLE_ACTIONS} ${whereSql}`,
    args,
  });
  const row = (res.rows as Record<string, unknown>[])[0];
  if (!row) return EMPTY_FLOW;
  return {
    pendingDispatch: Number(row.pending_dispatch ?? 0),
    dispatched: Number(row.dispatched ?? 0),
    inProgress: Number(row.in_progress ?? 0),
    withFeedback: Number(row.with_feedback ?? 0),
    timeoutAnomaly: Number(row.timeout_anomaly ?? 0),
  };
}

/** 单次请求内按管家 ID 去重；用 SQL 聚合替代全量 list + map。 */
export const summarizeActionFlow = cache(summarizeActionFlowUncached);
