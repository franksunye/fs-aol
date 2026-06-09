import { db, ensureSchema, TABLE_BLOCKERS, TABLE_LOGS, TABLE_OUTCOMES } from "../db";
import type { BlockerType } from "../blockers";
import { logsHasInboxColumns } from "../logs-schema";
import { migrateInboxColumns } from "../migrate-inbox-columns";
import type { BlockerRow, Decision, SuggestionDoc } from "./types";
import { mapBlocker } from "./mappers";

async function ensureInboxColumnsReady(): Promise<boolean> {
  await ensureSchema();
  if (await logsHasInboxColumns()) return true;
  await migrateInboxColumns();
  return logsHasInboxColumns();
}

export async function getLatestBlocker(
  dedupeKey: string
): Promise<BlockerRow | null> {
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT * FROM ${TABLE_BLOCKERS} WHERE dedupe_key = ? ORDER BY id DESC LIMIT 1`,
    args: [dedupeKey],
  });
  const row = (res.rows as unknown as Record<string, unknown>[])[0];
  return row ? mapBlocker(row) : null;
}

export async function recordBlocker(input: {
  dedupeKey: string;
  workOrderId: string;
  blockerType: BlockerType;
  note?: string;
  operator?: string;
  source?: string;
}): Promise<void> {
  await ensureSchema();
  await db.execute({
    sql: `INSERT INTO ${TABLE_BLOCKERS}
      (dedupe_key, work_order_id, blocker_type, note, source, operator, created_at)
      VALUES (?,?,?,?,?,?,?)`,
    args: [
      input.dedupeKey,
      input.workOrderId,
      input.blockerType,
      input.note ?? "",
      input.source ?? "housekeeper_selected",
      input.operator ?? "console",
      new Date().toISOString(),
    ],
  });
}

export async function recordOutcome(input: {
  dedupeKey: string;
  workOrderId: string;
  decision: Decision;
  note?: string;
  operator?: string;
  modifiedSuggestion?: SuggestionDoc | null;
}): Promise<void> {
  await ensureInboxColumnsReady();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO ${TABLE_OUTCOMES}
      (dedupe_key, work_order_id, decision, note, operator, modified_suggestion, created_at)
      VALUES (?,?,?,?,?,?,?)`,
    args: [
      input.dedupeKey,
      input.workOrderId,
      input.decision,
      input.note ?? "",
      input.operator ?? "console",
      input.modifiedSuggestion
        ? JSON.stringify(input.modifiedSuggestion)
        : null,
      now,
    ],
  });
  await db.execute({
    sql: `UPDATE ${TABLE_LOGS}
      SET inbox_bucket = 'closed', archive_reason = 'has_outcome', reconciled_at = ?
      WHERE dedupe_key = ?`,
    args: [now, input.dedupeKey],
  });
}
