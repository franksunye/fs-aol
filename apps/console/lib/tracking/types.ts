import type { BlockerType } from "../blockers";
import type { InboxBucket } from "../labels";

export type Decision = "approved" | "rejected" | "modified" | "followed_up";

/** Action Spec v0.2 — 键名对齐 contracts/suggestion.schema.json */
export interface SuggestionDoc {
  规格版本?: string;
  需要跟进?: boolean;
  优先级?: string;
  客户情绪?: string;
  原因摘要?: string;
  优先级依据?: string[];
  情况判断?: {
    商机阶段?: string;
    报价状态?: string;
    金额与方案?: string;
    渠道与部位?: string;
  };
  跟进方案?: {
    主行动?: string;
    沟通要点?: string[];
    避免事项?: string[];
  };
  引用查证?: string[];
}

export interface OutcomeRow {
  id: number;
  dedupeKey: string;
  workOrderId: string;
  decision: Decision;
  note: string;
  operator: string;
  modifiedSuggestion: SuggestionDoc | null;
  createdAt: string;
}

export interface BlockerRow {
  id: number;
  dedupeKey: string;
  workOrderId: string;
  blockerType: BlockerType;
  note: string;
  source: string;
  operator: string;
  createdAt: string;
}

export interface SuggestionRow {
  dedupeKey: string;
  workOrderId: string;
  eventType: string;
  orderNum: string;
  city: string;
  housekeeperId: string;
  /** 引擎写入时从 Mongo user 解析；非试点管家也有姓名 */
  housekeeperName: string;
  status: string;
  processedAt: string;
  stateAt: string | null;
  suggestion: SuggestionDoc;
  outcome: OutcomeRow | null;
  blocker: BlockerRow | null;
  inboxBucket: InboxBucket;
  archiveReason: string;
  reconciledAt: string | null;
  mongoStatus: string;
  liveVerdict: string;
  analyzedStaleDays: number | null;
}

export interface TraceStep {
  step?: number;
  kind?: string;
  name?: string;
  latency_ms?: number;
  status?: string;
  output?: Record<string, unknown>;
}

export interface TraceRow {
  id: number;
  workOrderId: string;
  mode: string;
  model: string;
  status: string;
  error: string;
  latencyMs: number;
  totalTokens: number;
  promptSystem: string;
  promptUser: string;
  rawResponse: string;
  parsed: SuggestionDoc | null;
  steps: TraceStep[];
  enrich: Record<string, unknown> | null;
  createdAt: string;
}

export type InboxBucketCounts = Record<InboxBucket, number>;

export type ActionStatus =
  | "pending_dispatch"
  | "in_progress"
  | "completed"
  | "rejected"
  | "timeout"
  | "no_feedback";

export interface ActionRow {
  id: number;
  dedupeKey: string;
  workOrderId: string;
  traceId: number | null;
  title: string;
  priority: string;
  assigneeId: string;
  status: ActionStatus;
  reviewOutcomeId: number | null;
  terminalFeedback: string;
  operator: string;
  createdAt: string;
  dispatchedAt: string | null;
  completedAt: string | null;
}

export interface DashboardStats {
  total: number;
  needFollow: number;
  pending: number;
  approved: number;
  rejected: number;
  modified: number;
  followedUp: number;
  handledRate: number;
  adoptionRate: number;
  exposureCount: number;
  blockerCaptureRate: number;
  unknownBlockerRate: number;
  byPriority: Record<string, number>;
}
