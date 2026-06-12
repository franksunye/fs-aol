import { TABLE_LOGS, TABLE_OUTCOMES } from "../db";
import { query } from "../data/client";
import type { Decision } from "./types";
import { parseQuoteAmountYuan } from "../parse-quote-amount";
import type { SuggestionDoc } from "./types";
import { parseJson, str } from "./parse";

const ACTION_DECISIONS: Decision[] = ["approved", "modified", "followed_up"];

/** suggestion JSON：仅显式 false 排除（与 needsFollow() 一致）。 */
export const NEEDS_FOLLOW_SQL = `(
  json_extract(suggestion, '$.需要跟进') IS NULL
  OR json_extract(suggestion, '$.需要跟进') NOT IN (0, 'false', 'False')
)`;

function toIso(d: Date): string {
  return d.toISOString();
}

function hkFilter(
  column: string,
  housekeeperId?: string
): { clause: string; args: string[] } {
  const hk = housekeeperId?.trim();
  if (!hk) return { clause: "", args: [] };
  return { clause: ` AND ${column} = ?`, args: [hk] };
}

export type LogsPeriodAggregate = {
  discovered: number;
  avgStaleDays: number | null;
  byPriority: Record<string, number>;
  trendDiscovered: Map<string, number>;
};

export async function aggregateLogsPeriod(
  start: Date,
  end: Date,
  housekeeperId?: string
): Promise<LogsPeriodAggregate> {
  const hk = hkFilter("housekeeper_id", housekeeperId);
  const baseWhere = `processed_at >= ? AND processed_at < ? AND ${NEEDS_FOLLOW_SQL}${hk.clause}`;
  const baseArgs: (string | number)[] = [toIso(start), toIso(end), ...hk.args];

  const [countRes, staleRes, prioRes, trendRes] = await Promise.all([
    query(
      `SELECT COUNT(*) AS c FROM ${TABLE_LOGS} WHERE ${baseWhere}`,
      baseArgs
    ),
    query(
      `SELECT AVG(analyzed_stale_days) AS avg_stale
       FROM ${TABLE_LOGS}
       WHERE ${baseWhere}
         AND analyzed_stale_days IS NOT NULL
         AND analyzed_stale_days >= 0`,
      baseArgs
    ),
    query(
      `SELECT COALESCE(json_extract(suggestion, '$.优先级'), '未定') AS prio,
              COUNT(*) AS c
       FROM ${TABLE_LOGS}
       WHERE ${baseWhere}
       GROUP BY prio`,
      baseArgs
    ),
    query(
      `SELECT strftime('%Y-%m-%d', processed_at) AS day, COUNT(*) AS c
       FROM ${TABLE_LOGS}
       WHERE ${baseWhere}
       GROUP BY day`,
      baseArgs
    ),
  ]);

  const byPriority: Record<string, number> = {};
  for (const row of prioRes.rows as unknown as Record<string, unknown>[]) {
    const key = str(row.prio) || "未定";
    byPriority[key] = Number(row.c ?? 0);
  }

  const trendDiscovered = new Map<string, number>();
  for (const row of trendRes.rows as unknown as Record<string, unknown>[]) {
    const day = str(row.day);
    if (day) trendDiscovered.set(day, Number(row.c ?? 0));
  }

  const staleRow = staleRes.rows[0] as Record<string, unknown> | undefined;
  const avgRaw = staleRow?.avg_stale;
  const avgStaleDays =
    avgRaw != null && Number.isFinite(Number(avgRaw))
      ? Math.round(Number(avgRaw) * 10) / 10
      : null;

  const countRow = countRes.rows[0] as Record<string, unknown> | undefined;
  return {
    discovered: Number(countRow?.c ?? 0),
    avgStaleDays,
    byPriority,
    trendDiscovered,
  };
}

export type OutcomesPeriodAggregate = {
  actions: number;
  drivenAmount: number;
  trendActions: Map<string, number>;
  breakdown: Record<Decision, number>;
};

export async function aggregateOutcomesPeriod(
  start: Date,
  end: Date,
  housekeeperId?: string
): Promise<OutcomesPeriodAggregate> {
  const hk = hkFilter("l.housekeeper_id", housekeeperId);
  const where = `o.created_at >= ? AND o.created_at < ?${hk.clause}`;
  const args: (string | number)[] = [toIso(start), toIso(end), ...hk.args];

  const [breakdownRes, trendRes, amountRes] = await Promise.all([
    query(
      `SELECT o.decision, COUNT(*) AS c
       FROM ${TABLE_OUTCOMES} o
       INNER JOIN ${TABLE_LOGS} l ON l.dedupe_key = o.dedupe_key
       WHERE ${where}
       GROUP BY o.decision`,
      args
    ),
    query(
      `SELECT strftime('%Y-%m-%d', o.created_at) AS day, COUNT(*) AS c
       FROM ${TABLE_OUTCOMES} o
       INNER JOIN ${TABLE_LOGS} l ON l.dedupe_key = o.dedupe_key
       WHERE ${where}
         AND o.decision IN (${ACTION_DECISIONS.map(() => "?").join(",")})
       GROUP BY day`,
      [...args, ...ACTION_DECISIONS]
    ),
    query(
      `SELECT o.decision, o.created_at, l.suggestion
       FROM ${TABLE_OUTCOMES} o
       INNER JOIN ${TABLE_LOGS} l ON l.dedupe_key = o.dedupe_key
       WHERE ${where}
         AND o.decision IN (${ACTION_DECISIONS.map(() => "?").join(",")})`,
      [...args, ...ACTION_DECISIONS]
    ),
  ]);

  const breakdown: Record<string, number> = {
    approved: 0,
    modified: 0,
    rejected: 0,
    followed_up: 0,
  };
  for (const row of breakdownRes.rows as unknown as Record<string, unknown>[]) {
    const d = str(row.decision);
    if (d in breakdown) breakdown[d] += Number(row.c ?? 0);
  }

  const trendActions = new Map<string, number>();
  for (const row of trendRes.rows as unknown as Record<string, unknown>[]) {
    const day = str(row.day);
    if (day) trendActions.set(day, Number(row.c ?? 0));
  }

  let drivenAmount = 0;
  for (const row of amountRes.rows as unknown as Record<string, unknown>[]) {
    const suggestion = parseJson<SuggestionDoc>(row.suggestion, {});
    const amt = parseQuoteAmountYuan(suggestion);
    if (amt != null) drivenAmount += amt;
  }

  const actions = ACTION_DECISIONS.reduce(
    (sum, d) => sum + (breakdown[d] ?? 0),
    0
  );

  return {
    actions,
    drivenAmount,
    trendActions,
    breakdown: breakdown as Record<Decision, number>,
  };
}
