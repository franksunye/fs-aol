import { cache } from "react";
import { TABLE_BLOCKERS, TABLE_LOGS, TABLE_OUTCOMES } from "../db";
import { query } from "../data/client";
import type { ActionReviewMetricCards } from "../action-review-metric-cards";
import type { PriorityFilter } from "../priority-filter";
import { parseQuoteAmountYuan } from "../parse-quote-amount";
import type { DashboardStats } from "./types";
import { ensureInboxColumnsReady } from "../data/inbox-schema";
import { parseJson } from "./parse";
import type { SuggestionDoc } from "./types";

const LATEST_OUTCOME_JOIN = `LEFT JOIN ${TABLE_OUTCOMES} o ON o.id = (
  SELECT MAX(o2.id) FROM ${TABLE_OUTCOMES} o2 WHERE o2.dedupe_key = l.dedupe_key
)`;

const LATEST_BLOCKER_JOIN = `LEFT JOIN ${TABLE_BLOCKERS} b ON b.id = (
  SELECT MAX(b2.id) FROM ${TABLE_BLOCKERS} b2 WHERE b2.dedupe_key = l.dedupe_key
)`;

function needsFollowSql(suggestionCol = "l.suggestion"): string {
  return `(
    json_extract(${suggestionCol}, '$.需要跟进') IS NULL
    OR json_extract(${suggestionCol}, '$.需要跟进') NOT IN (0, 'false', 'False')
  )`;
}

async function activeInboxFromClause(housekeeperId?: string): Promise<{
  sql: string;
  args: string[];
}> {
  const hasInbox = await ensureInboxColumnsReady();
  const where: string[] = [];
  const args: string[] = [];
  if (hasInbox) {
    where.push("(l.inbox_bucket IS NULL OR l.inbox_bucket = 'active')");
  }
  const hk = housekeeperId?.trim();
  if (hk) {
    where.push("l.housekeeper_id = ?");
    args.push(hk);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return {
    sql: `FROM ${TABLE_LOGS} l
          ${LATEST_OUTCOME_JOIN}
          ${LATEST_BLOCKER_JOIN}
          ${whereSql}`,
    args,
  };
}

export type ActiveInboxPriorityCounts = Record<PriorityFilter, number>;

function buildDashboardStats(row: Record<string, unknown>): DashboardStats {
  const needFollow = Number(row.need_follow ?? 0);
  const approved = Number(row.approved ?? 0);
  const rejected = Number(row.rejected ?? 0);
  const modified = Number(row.modified ?? 0);
  const followedUp = Number(row.followed_up ?? 0);
  const handled = approved + rejected + modified + followedUp;
  const adopted = approved + modified + followedUp;
  const capturedBlockers = Number(row.captured_blockers ?? 0);
  const total = Number(row.total ?? 0);
  const exposureCount = Number(row.exposure ?? 0) || total;
  const blockerCaptureRate = needFollow
    ? Math.round((capturedBlockers / needFollow) * 100)
    : 0;

  const byPriority: Record<string, number> = {};
  for (const key of ["高", "中", "低", "未定"] as const) {
    const c = Number(row[`prio_${key}`] ?? 0);
    if (c > 0) byPriority[key] = c;
  }

  return {
    total,
    needFollow,
    pending: Number(row.pending ?? 0),
    approved,
    rejected,
    modified,
    followedUp,
    handledRate: needFollow ? Math.round((handled / needFollow) * 100) : 0,
    adoptionRate: needFollow ? Math.round((adopted / needFollow) * 100) : 0,
    exposureCount,
    blockerCaptureRate,
    unknownBlockerRate: needFollow ? 100 - blockerCaptureRate : 0,
    byPriority,
  };
}

async function loadActiveReviewMetricsUncached(
  housekeeperId?: string
): Promise<ActionReviewMetricCards> {
  const { sql: fromSql, args } = await activeInboxFromClause(housekeeperId);
  const nf = needsFollowSql();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const [statsRes, amountRes] = await Promise.all([
    query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN ${nf} THEN 1 ELSE 0 END) AS need_follow,
         SUM(CASE WHEN ${nf} AND o.id IS NULL THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN o.decision = 'approved' THEN 1 ELSE 0 END) AS approved,
         SUM(CASE WHEN o.decision = 'rejected' THEN 1 ELSE 0 END) AS rejected,
         SUM(CASE WHEN o.decision = 'modified' THEN 1 ELSE 0 END) AS modified,
         SUM(CASE WHEN o.decision = 'followed_up' THEN 1 ELSE 0 END) AS followed_up,
         SUM(CASE WHEN l.status = 'sent' THEN 1 ELSE 0 END) AS exposure,
         SUM(CASE WHEN b.blocker_type IS NOT NULL AND b.blocker_type != 'UNKNOWN' THEN 1 ELSE 0 END) AS captured_blockers,
         SUM(CASE WHEN ${nf} AND json_extract(l.suggestion, '$.优先级') = '高' THEN 1 ELSE 0 END) AS prio_高,
         SUM(CASE WHEN ${nf} AND json_extract(l.suggestion, '$.优先级') = '中' THEN 1 ELSE 0 END) AS prio_中,
         SUM(CASE WHEN ${nf} AND json_extract(l.suggestion, '$.优先级') = '低' THEN 1 ELSE 0 END) AS prio_低,
         SUM(CASE WHEN ${nf} AND (json_extract(l.suggestion, '$.优先级') IS NULL OR json_extract(l.suggestion, '$.优先级') = '') THEN 1 ELSE 0 END) AS prio_未定,
         SUM(CASE WHEN ${nf} AND o.id IS NULL AND l.processed_at >= ? THEN 1 ELSE 0 END) AS today_new
       ${fromSql}`,
      [...args, todayIso]
    ),
    query(
      `SELECT l.suggestion
       ${fromSql}
         AND ${nf}
         AND o.id IS NULL`,
      args
    ),
  ]);

  const statsRow = (statsRes.rows[0] ?? {}) as Record<string, unknown>;
  const base = buildDashboardStats(statsRow);
  const pending = Number(statsRow.pending ?? 0);
  const high = base.byPriority["高"] ?? 0;

  let pushableAmount = 0;
  let quotedCount = 0;
  for (const row of amountRes.rows as unknown as Record<string, unknown>[]) {
    const suggestion = parseJson<SuggestionDoc>(row.suggestion, {});
    const amt = parseQuoteAmountYuan(suggestion);
    if (amt != null) {
      pushableAmount += amt;
      quotedCount += 1;
    }
  }

  return {
    base,
    pending: base.pending,
    todayNewInPool: Number(statsRow.today_new ?? 0),
    quotedCount,
    pushableAmount,
    highPriority: high,
    highPriorityShare: pending ? Math.round((high / pending) * 100) : 0,
  };
}

async function loadActivePriorityCountsUncached(
  housekeeperId?: string
): Promise<ActiveInboxPriorityCounts> {
  const { sql: fromSql, args } = await activeInboxFromClause(housekeeperId);
  const res = await query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN json_extract(l.suggestion, '$.优先级') = '高' THEN 1 ELSE 0 END) AS high,
       SUM(CASE WHEN json_extract(l.suggestion, '$.优先级') = '中' THEN 1 ELSE 0 END) AS mid,
       SUM(CASE WHEN json_extract(l.suggestion, '$.优先级') = '低' THEN 1 ELSE 0 END) AS low,
       SUM(CASE WHEN o.id IS NULL THEN 1 ELSE 0 END) AS pending
     ${fromSql}`,
    args
  );
  const row = (res.rows[0] ?? {}) as Record<string, unknown>;
  return {
    all: Number(row.total ?? 0),
    高: Number(row.high ?? 0),
    中: Number(row.mid ?? 0),
    低: Number(row.low ?? 0),
    pending: Number(row.pending ?? 0),
  };
}

export const loadActiveInboxReviewMetrics = cache(loadActiveReviewMetricsUncached);
export const loadActiveInboxPriorityCounts = cache(loadActivePriorityCountsUncached);
