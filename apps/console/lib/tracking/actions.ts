import {
  db,
  ensureSchema,
  TABLE_ACTIONS,
  TABLE_LOGS,
  TABLE_OUTCOMES,
} from "../db";
import { actionTitleFromSuggestion } from "../adapters/run";
import type { ExecutionAction } from "../action-execution-mock";
import { XLINK_SOURCE_SYSTEM } from "../action-list-display";
import {
  addDays,
  formatDateKey,
  type CalendarPriority,
} from "../calendar-mock";
import {
  housekeeperName,
  loadPilotHousekeepers,
} from "../pilot-housekeepers";
import { FOLLOW_UP_SKILL } from "../skills";
import type { ActionRow, ActionStatus, Decision, SuggestionDoc } from "./types";

const FOLLOW_UP_AGENT_ID = FOLLOW_UP_SKILL.id;
const FOLLOW_UP_AGENT_NAME = FOLLOW_UP_SKILL.productName;
import { mapAction } from "./mappers";
import { getSuggestion } from "./inbox";
import { listTracesLite } from "./traces";
import { parseJson, str } from "./parse";
import { ClipboardCheck } from "lucide-react";
import type { ExecutionStatus } from "../execution-status";

const PENDING_STATUSES: ActionStatus[] = ["pending_dispatch", "in_progress"];

function mapPriority(p?: string): CalendarPriority {
  if (p === "高") return "high";
  if (p === "低") return "low";
  return "medium";
}

function mapActionStatusToExecution(status: ActionStatus): ExecutionStatus {
  switch (status) {
    case "pending_dispatch":
      return "pending_dispatch";
    case "in_progress":
      return "in_progress";
    case "completed":
      return "completed";
    case "rejected":
      return "rejected";
    case "timeout":
      return "timeout";
    case "no_feedback":
      return "no_feedback";
    default:
      return "pending_dispatch";
  }
}

export async function createActionFromApproval(input: {
  dedupeKey: string;
  workOrderId: string;
  reviewOutcomeId: number;
  suggestion: SuggestionDoc;
  assigneeId: string;
  traceId?: number | null;
  operator?: string;
}): Promise<ActionRow> {
  await ensureSchema();
  const now = new Date().toISOString();
  const title = actionTitleFromSuggestion(input.suggestion);
  const priority = input.suggestion.优先级 ?? "中";
  await db.execute({
    sql: `INSERT INTO ${TABLE_ACTIONS}
      (dedupe_key, work_order_id, trace_id, title, priority, assignee_id, status,
       review_outcome_id, terminal_feedback, operator, created_at, dispatched_at, completed_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      input.dedupeKey,
      input.workOrderId,
      input.traceId ?? null,
      title,
      priority,
      input.assigneeId,
      "pending_dispatch",
      input.reviewOutcomeId,
      "",
      input.operator ?? "console",
      now,
      now,
      null,
    ],
  });
  const res = await db.execute({
    sql: `SELECT * FROM ${TABLE_ACTIONS} WHERE dedupe_key = ? ORDER BY id DESC LIMIT 1`,
    args: [input.dedupeKey],
  });
  const row = (res.rows as unknown as Record<string, unknown>[])[0];
  return mapAction(row);
}

export async function getActionById(id: number): Promise<ActionRow | null> {
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT * FROM ${TABLE_ACTIONS} WHERE id = ? LIMIT 1`,
    args: [id],
  });
  const row = (res.rows as unknown as Record<string, unknown>[])[0];
  return row ? mapAction(row) : null;
}

export async function getLatestActionForDedupe(
  dedupeKey: string
): Promise<ActionRow | null> {
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT * FROM ${TABLE_ACTIONS} WHERE dedupe_key = ? ORDER BY id DESC LIMIT 1`,
    args: [dedupeKey],
  });
  const row = (res.rows as unknown as Record<string, unknown>[])[0];
  return row ? mapAction(row) : null;
}

export async function listActions(options?: {
  housekeeperId?: string;
  status?: ActionStatus | ActionStatus[];
  limit?: number;
  offset?: number;
}): Promise<ActionRow[]> {
  await ensureSchema();
  const where: string[] = [];
  const args: (string | number)[] = [];
  const hk = options?.housekeeperId?.trim();
  if (hk) {
    where.push("assignee_id = ?");
    args.push(hk);
  }
  if (options?.status) {
    const statuses = Array.isArray(options.status)
      ? options.status
      : [options.status];
    where.push(`status IN (${statuses.map(() => "?").join(",")})`);
    args.push(...statuses);
  }
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 500);
  const offset = Math.max(0, options?.offset ?? 0);
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const res = await db.execute({
    sql: `SELECT * FROM ${TABLE_ACTIONS} ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, offset],
  });
  return (res.rows as unknown as Record<string, unknown>[]).map(mapAction);
}

export async function countPendingActions(options?: {
  housekeeperId?: string;
}): Promise<number> {
  await ensureSchema();
  const where: string[] = [
    `status IN (${PENDING_STATUSES.map(() => "?").join(",")})`,
  ];
  const args: string[] = [...PENDING_STATUSES];
  const hk = options?.housekeeperId?.trim();
  if (hk) {
    where.push("assignee_id = ?");
    args.push(hk);
  }
  const res = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM ${TABLE_ACTIONS} WHERE ${where.join(" AND ")}`,
    args,
  });
  return Number((res.rows as { c?: number }[])[0]?.c ?? 0);
}

export async function completeAction(input: {
  actionId: number;
  terminalFeedback: string;
  operator?: string;
}): Promise<void> {
  await ensureSchema();
  const now = new Date().toISOString();
  const action = await getActionById(input.actionId);
  if (!action) throw new Error("Action not found");

  await db.execute({
    sql: `UPDATE ${TABLE_ACTIONS}
      SET status = 'completed', terminal_feedback = ?, operator = ?, completed_at = ?
      WHERE id = ?`,
    args: [
      input.terminalFeedback,
      input.operator ?? "console",
      now,
      input.actionId,
    ],
  });

  await db.execute({
    sql: `UPDATE ${TABLE_LOGS}
      SET inbox_bucket = 'closed', archive_reason = 'action_completed', reconciled_at = ?
      WHERE dedupe_key = ?`,
    args: [now, action.dedupeKey],
  });
}

export async function transitionAction(input: {
  actionId: number;
  status: ActionStatus;
  operator?: string;
}): Promise<void> {
  await ensureSchema();
  const now = new Date().toISOString();
  const sets = ["status = ?", "operator = ?"];
  const args: (string | number)[] = [input.status, input.operator ?? "console"];
  if (input.status === "in_progress") {
    sets.push("dispatched_at = COALESCE(dispatched_at, ?)");
    args.push(now);
  }
  args.push(input.actionId);
  await db.execute({
    sql: `UPDATE ${TABLE_ACTIONS} SET ${sets.join(", ")} WHERE id = ?`,
    args,
  });
}

export async function mapActionToExecution(
  action: ActionRow
): Promise<ExecutionAction> {
  const pilots = loadPilotHousekeepers();
  const row = await getSuggestion(action.dedupeKey);
  const suggestion = row?.suggestion ?? {};
  const due = formatDateKey(addDays(new Date(action.createdAt), 1));
  return {
    id: String(action.id),
    title: action.title,
    opportunityId: row?.orderNum || action.workOrderId,
    sourceAgent: FOLLOW_UP_AGENT_NAME,
    agentId: FOLLOW_UP_AGENT_ID,
    sourceSystem: XLINK_SOURCE_SYSTEM,
    target: { name: row?.orderNum || "工单", type: "工单" },
    dueDate: due,
    dueTime: "18:00",
    priority: mapPriority(action.priority),
    status: mapActionStatusToExecution(action.status),
    assignee:
      housekeeperName(pilots, action.assigneeId) || action.assigneeId,
    assigneeId: action.assigneeId,
    estimateMins: 15,
    workOrderKey: action.dedupeKey,
    icon: ClipboardCheck,
    goal:
      suggestion.原因摘要 ||
      suggestion.跟进方案?.主行动 ||
      action.title,
    dispatchTarget: "Console 执行反馈",
    createdAt: action.createdAt,
    lastSyncedAt: action.completedAt || action.dispatchedAt || action.createdAt,
    terminalFeedback: action.terminalFeedback || undefined,
    contextFacts: [
      { label: "情况判断", value: suggestion.情况判断?.商机阶段 || "—" },
      { label: "主行动", value: suggestion.跟进方案?.主行动 || action.title },
      {
        label: "优先级",
        value: action.priority || suggestion.优先级 || "—",
      },
    ],
    timeline: [
      {
        at: action.createdAt,
        title: "进入待执行",
        detail: "人审批准",
      },
      ...(action.dispatchedAt
        ? [{ at: action.dispatchedAt, title: "开始执行" }]
        : []),
      ...(action.completedAt
        ? [
            {
              at: action.completedAt,
              title: "执行完成",
              detail: action.terminalFeedback,
            },
          ]
        : []),
    ],
  };
}

export async function listExecutionActions(options?: {
  housekeeperId?: string;
}): Promise<ExecutionAction[]> {
  const actions = await listActions({
    housekeeperId: options?.housekeeperId,
    status: ["pending_dispatch", "in_progress"],
    limit: 200,
  });
  return Promise.all(actions.map(mapActionToExecution));
}

export async function resolveTraceIdForDedupe(
  dedupeKey: string,
  workOrderId: string
): Promise<number | null> {
  const traces = await listTracesLite(workOrderId);
  if (traces.length === 0) return null;
  return traces[traces.length - 1]?.id ?? null;
}

export async function getLatestOutcomeId(
  dedupeKey: string
): Promise<number | null> {
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT id FROM ${TABLE_OUTCOMES} WHERE dedupe_key = ? ORDER BY id DESC LIMIT 1`,
    args: [dedupeKey],
  });
  const row = (res.rows as { id?: number }[])[0];
  return row?.id != null ? Number(row.id) : null;
}
