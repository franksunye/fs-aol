import { db, ensureSchema, TABLE_LOGS, TABLE_OUTCOMES, TABLE_BLOCKERS } from "../db";
import type { InboxBucket } from "../labels";
import { logsHasInboxColumns } from "../logs-schema";
import { migrateInboxColumns } from "../migrate-inbox-columns";
import type { BlockerRow, InboxBucketCounts, OutcomeRow, SuggestionRow } from "./types";
import { mapBlocker, mapOutcome, mapSuggestion } from "./mappers";
import { str } from "./parse";

async function latestOutcomesForKeys(
  dedupeKeys: string[]
): Promise<Map<string, OutcomeRow>> {
  const map = new Map<string, OutcomeRow>();
  if (dedupeKeys.length === 0) return map;
  const ph = dedupeKeys.map(() => "?").join(",");
  const res = await db.execute({
    sql: `SELECT o.* FROM ${TABLE_OUTCOMES} o
          INNER JOIN (
            SELECT dedupe_key, MAX(id) AS mid FROM ${TABLE_OUTCOMES}
            WHERE dedupe_key IN (${ph}) GROUP BY dedupe_key
          ) m ON o.id = m.mid`,
    args: dedupeKeys,
  });
  for (const row of res.rows as unknown as Record<string, unknown>[]) {
    const o = mapOutcome(row);
    map.set(o.dedupeKey, o);
  }
  return map;
}

async function latestBlockersForKeys(
  dedupeKeys: string[]
): Promise<Map<string, BlockerRow>> {
  const map = new Map<string, BlockerRow>();
  if (dedupeKeys.length === 0) return map;
  const ph = dedupeKeys.map(() => "?").join(",");
  const res = await db.execute({
    sql: `SELECT b.* FROM ${TABLE_BLOCKERS} b
          INNER JOIN (
            SELECT dedupe_key, MAX(id) AS mid FROM ${TABLE_BLOCKERS}
            WHERE dedupe_key IN (${ph}) GROUP BY dedupe_key
          ) m ON b.id = m.mid`,
    args: dedupeKeys,
  });
  for (const row of res.rows as unknown as Record<string, unknown>[]) {
    const b = mapBlocker(row);
    map.set(b.dedupeKey, b);
  }
  return map;
}

async function ensureInboxColumnsReady(): Promise<boolean> {
  await ensureSchema();
  if (await logsHasInboxColumns()) return true;
  await migrateInboxColumns();
  return logsHasInboxColumns();
}

export async function countInboxBuckets(options?: {
  housekeeperId?: string;
}): Promise<InboxBucketCounts> {
  const hasInbox = await ensureInboxColumnsReady();
  const hk = options?.housekeeperId?.trim();
  if (!hasInbox) {
    const sql = hk
      ? `SELECT COUNT(*) AS c FROM ${TABLE_LOGS} WHERE housekeeper_id = ?`
      : `SELECT COUNT(*) AS c FROM ${TABLE_LOGS}`;
    const res = await db.execute({ sql, args: hk ? [hk] : [] });
    const c = Number((res.rows as { c?: number }[])[0]?.c ?? 0);
    return { active: c, closed: 0, archived: 0 };
  }
  const clauses: string[] = [];
  const args: string[] = [];
  if (hk) {
    clauses.push("housekeeper_id = ?");
    args.push(hk);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const res = await db.execute({
    sql: `SELECT
            SUM(CASE WHEN inbox_bucket IS NULL OR inbox_bucket = 'active' THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN inbox_bucket = 'closed' THEN 1 ELSE 0 END) AS closed,
            SUM(CASE WHEN inbox_bucket = 'archived' THEN 1 ELSE 0 END) AS archived
          FROM ${TABLE_LOGS} ${where}`,
    args,
  });
  const row = (res.rows as { active?: number; closed?: number; archived?: number }[])[0];
  return {
    active: Number(row?.active ?? 0),
    closed: Number(row?.closed ?? 0),
    archived: Number(row?.archived ?? 0),
  };
}

export async function listSuggestions(options?: {
  housekeeperId?: string;
  inboxBucket?: InboxBucket;
  limit?: number;
}): Promise<SuggestionRow[]> {
  const hasInbox = await ensureInboxColumnsReady();
  const hk = options?.housekeeperId?.trim();
  const bucket = options?.inboxBucket ?? "active";
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 500);
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (hasInbox) {
    if (bucket === "active") {
      where.push("(inbox_bucket IS NULL OR inbox_bucket = 'active')");
    } else {
      where.push("inbox_bucket = ?");
      args.push(bucket);
    }
  }
  if (hk) {
    where.push("housekeeper_id = ?");
    args.push(hk);
  }
  args.push(limit);
  const sql =
    where.length > 0
      ? `SELECT * FROM ${TABLE_LOGS} WHERE ${where.join(
          " AND "
        )} ORDER BY processed_at DESC LIMIT ?`
      : `SELECT * FROM ${TABLE_LOGS} ORDER BY processed_at DESC LIMIT ?`;
  const res = await db.execute({ sql, args });
  const logRows = res.rows as unknown as Record<string, unknown>[];
  const keys = logRows.map((r) => str(r.dedupe_key)).filter(Boolean);
  const [outcomes, blockers] = await Promise.all([
    latestOutcomesForKeys(keys),
    latestBlockersForKeys(keys),
  ]);
  return logRows.map((r) => mapSuggestion(r, outcomes, blockers));
}

export async function getSuggestion(
  dedupeKey: string
): Promise<SuggestionRow | null> {
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT
            l.*,
            o.id AS o_id, o.dedupe_key AS o_dedupe_key, o.work_order_id AS o_work_order_id,
            o.decision AS o_decision, o.note AS o_note, o.operator AS o_operator,
            o.modified_suggestion AS o_modified_suggestion, o.created_at AS o_created_at,
            b.id AS b_id, b.dedupe_key AS b_dedupe_key, b.work_order_id AS b_work_order_id,
            b.blocker_type AS b_blocker_type, b.note AS b_note, b.source AS b_source,
            b.operator AS b_operator, b.created_at AS b_created_at
          FROM ${TABLE_LOGS} l
          LEFT JOIN ${TABLE_OUTCOMES} o ON o.id = (
            SELECT MAX(o2.id) FROM ${TABLE_OUTCOMES} o2 WHERE o2.dedupe_key = l.dedupe_key
          )
          LEFT JOIN ${TABLE_BLOCKERS} b ON b.id = (
            SELECT MAX(b2.id) FROM ${TABLE_BLOCKERS} b2 WHERE b2.dedupe_key = l.dedupe_key
          )
          WHERE l.dedupe_key = ? LIMIT 1`,
    args: [dedupeKey],
  });
  const row = (res.rows as unknown as Record<string, unknown>[])[0];
  if (!row) return null;
  const outcomes = new Map<string, OutcomeRow>();
  const blockers = new Map<string, BlockerRow>();
  if (row.o_id != null) {
    const o = mapOutcome({
      id: row.o_id,
      dedupe_key: row.o_dedupe_key,
      work_order_id: row.o_work_order_id,
      decision: row.o_decision,
      note: row.o_note,
      operator: row.o_operator,
      modified_suggestion: row.o_modified_suggestion,
      created_at: row.o_created_at,
    });
    outcomes.set(o.dedupeKey, o);
  }
  if (row.b_id != null) {
    const b = mapBlocker({
      id: row.b_id,
      dedupe_key: row.b_dedupe_key,
      work_order_id: row.b_work_order_id,
      blocker_type: row.b_blocker_type,
      note: row.b_note,
      source: row.b_source,
      operator: row.b_operator,
      created_at: row.b_created_at,
    });
    blockers.set(b.dedupeKey, b);
  }
  const logRow: Record<string, unknown> = { ...row };
  for (const k of Object.keys(logRow)) {
    if (k.startsWith("o_") || k.startsWith("b_")) delete logRow[k];
  }
  return mapSuggestion(logRow, outcomes, blockers);
}
