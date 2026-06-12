import { db, ensureSchema, TABLE_BLOCKERS, TABLE_LOGS, TABLE_OUTCOMES } from "../db";
import { ensureInboxColumnsReady } from "../data/inbox-schema";
import { writeBatch } from "../data/client";
import type { BlockerType } from "../blockers";
import type { BlockerRow, Decision, SuggestionDoc } from "./types";
import { mapBlocker } from "./mappers";
import {
  createActionFromApproval,
  getLatestOutcomeId,
  resolveTraceIdForDedupe,
} from "./actions";
import { previewExecutionNotify } from "../execution-notify";
import { getSuggestion } from "./inbox";

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

function inboxBucketForDecision(decision: Decision): string {
  if (decision === "approved" || decision === "modified") return "execution";
  return "closed";
}

function archiveReasonForDecision(decision: Decision): string {
  if (decision === "approved" || decision === "modified") return "awaiting_execution";
  return "has_outcome";
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
  const bucket = inboxBucketForDecision(input.decision);
  const archiveReason = archiveReasonForDecision(input.decision);
  await writeBatch([
    {
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
    },
    {
      sql: `UPDATE ${TABLE_LOGS}
        SET inbox_bucket = ?, archive_reason = ?, reconciled_at = ?
        WHERE dedupe_key = ?`,
      args: [bucket, archiveReason, now, input.dedupeKey],
    },
  ]);

  if (input.decision === "approved" || input.decision === "modified") {
    const row = await getSuggestion(input.dedupeKey);
    const suggestion =
      input.modifiedSuggestion ?? row?.suggestion ?? ({} as SuggestionDoc);
    const outcomeId = (await getLatestOutcomeId(input.dedupeKey)) ?? 0;
    const traceId = await resolveTraceIdForDedupe(
      input.dedupeKey,
      input.workOrderId
    );
    const action = await createActionFromApproval({
      dedupeKey: input.dedupeKey,
      workOrderId: input.workOrderId,
      reviewOutcomeId: outcomeId,
      suggestion,
      assigneeId: row?.housekeeperId || "",
      traceId,
      operator: input.operator,
    });
    previewExecutionNotify({
      title: action.title,
      orderRef: row?.orderNum || input.workOrderId,
      assigneeId: action.assigneeId,
      actionId: action.id,
      dedupeKey: input.dedupeKey,
    });
  }
}
