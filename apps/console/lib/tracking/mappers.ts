import type { InboxBucket } from "../labels";
import type {
  ActionRow,
  ActionStatus,
  BlockerRow,
  OutcomeRow,
  SuggestionDoc,
  SuggestionRow,
  TraceRow,
  TraceStep,
} from "./types";
import { parseJson, str } from "./parse";

export function mapOutcome(row: Record<string, unknown>): OutcomeRow {
  return {
    id: Number(row.id),
    dedupeKey: str(row.dedupe_key),
    workOrderId: str(row.work_order_id),
    decision: str(row.decision) as OutcomeRow["decision"],
    note: str(row.note),
    operator: str(row.operator),
    modifiedSuggestion: parseJson<SuggestionDoc | null>(row.modified_suggestion, null),
    createdAt: str(row.created_at),
  };
}

export function mapBlocker(row: Record<string, unknown>): BlockerRow {
  return {
    id: Number(row.id),
    dedupeKey: str(row.dedupe_key),
    workOrderId: str(row.work_order_id),
    blockerType: str(row.blocker_type) as BlockerRow["blockerType"],
    note: str(row.note),
    source: str(row.source),
    operator: str(row.operator),
    createdAt: str(row.created_at),
  };
}

export function resolveInboxBucket(raw: unknown): InboxBucket {
  const v = str(raw).trim();
  if (v === "execution" || v === "closed" || v === "archived") return v;
  return "active";
}

export function mapSuggestion(
  row: Record<string, unknown>,
  outcomes: Map<string, OutcomeRow>,
  blockers: Map<string, BlockerRow>
): SuggestionRow {
  const dedupeKey = str(row.dedupe_key);
  return {
    dedupeKey,
    workOrderId: str(row.work_order_id),
    eventType: str(row.event_type),
    orderNum: str(row.order_num),
    city: str(row.city),
    housekeeperId: str(row.housekeeper_id),
    status: str(row.status),
    processedAt: str(row.processed_at),
    stateAt: str(row.state_at).trim() || null,
    suggestion: parseJson<SuggestionDoc>(row.suggestion, {}),
    outcome: outcomes.get(dedupeKey) ?? null,
    blocker: blockers.get(dedupeKey) ?? null,
    inboxBucket: resolveInboxBucket(row.inbox_bucket),
    archiveReason: str(row.archive_reason),
    reconciledAt: str(row.reconciled_at).trim() || null,
    mongoStatus: str(row.mongo_status),
    liveVerdict: str(row.live_verdict),
    analyzedStaleDays:
      row.analyzed_stale_days != null && String(row.analyzed_stale_days).trim() !== ""
        ? Number(row.analyzed_stale_days)
        : null,
  };
}

export function mapAction(row: Record<string, unknown>): ActionRow {
  return {
    id: Number(row.id),
    dedupeKey: str(row.dedupe_key),
    workOrderId: str(row.work_order_id),
    traceId: row.trace_id != null ? Number(row.trace_id) : null,
    title: str(row.title),
    priority: str(row.priority),
    assigneeId: str(row.assignee_id),
    status: str(row.status) as ActionStatus,
    reviewOutcomeId:
      row.review_outcome_id != null ? Number(row.review_outcome_id) : null,
    terminalFeedback: str(row.terminal_feedback),
    operator: str(row.operator),
    createdAt: str(row.created_at),
    dispatchedAt: str(row.dispatched_at).trim() || null,
    completedAt: str(row.completed_at).trim() || null,
  };
}

export function mapTraceRow(
  row: Record<string, unknown>,
  opts: { includePrompts: boolean }
): TraceRow {
  const steps = parseJson<TraceStep[]>(row.steps_json, []);
  const enrichStep = steps.find((s) => s.name === "enrich_work_order_context");
  return {
    id: Number(row.id ?? 0),
    workOrderId: str(row.work_order_id),
    mode: str(row.mode),
    model: str(row.model),
    status: str(row.status),
    error: str(row.error),
    latencyMs: Number(row.latency_ms ?? 0),
    totalTokens: Number(row.total_tokens ?? 0),
    promptSystem: opts.includePrompts ? str(row.prompt_system) : "",
    promptUser: opts.includePrompts ? str(row.prompt_user) : "",
    rawResponse: opts.includePrompts ? str(row.raw_response) : "",
    parsed: parseJson<SuggestionDoc | null>(row.parsed, null),
    steps,
    enrich: (enrichStep?.output as Record<string, unknown>) ?? null,
    createdAt: str(row.created_at),
  };
}
