import { housekeeperName, loadPilotHousekeepers } from "../pilot-housekeepers";
import type {
  DispositionDecision,
  SkillId,
  WorkItem,
  WorkItemListDisplay,
  WorkItemPriority,
} from "../operator-model";
import { SKILL_FOLLOW_UP } from "../operator-model";
import {
  actionInboxStatusLabel,
  actionTitle,
  FOLLOW_UP_SOURCE_AGENT,
  WORK_ORDER_OBJECT_TYPE,
  XLINK_SOURCE_SYSTEM,
} from "../action-list-display";
import { formatListTimestamp, opportunitySummaryPreview } from "../opportunity-display";
import type { SuggestionDoc, SuggestionRow } from "../tracking";

function mapPriority(raw?: string): WorkItemPriority | undefined {
  if (raw === "高") return "high";
  if (raw === "中") return "medium";
  if (raw === "低") return "low";
  return undefined;
}

function priorityDisplayLabel(priority?: WorkItemPriority, raw?: string): string {
  if (raw?.trim()) return raw.trim();
  switch (priority) {
    case "high":
      return "高";
    case "medium":
      return "中";
    case "low":
      return "低";
    default:
      return "—";
  }
}

function buildRecommendation(s: SuggestionDoc) {
  return {
    headline: s.原因摘要?.trim() ?? "",
    rationale: (s.优先级依据 ?? []).filter(Boolean).join("；"),
    primaryAction: s.跟进方案?.主行动?.trim() ?? "",
    talkingPoints: (s.跟进方案?.沟通要点 ?? []).filter(Boolean) as string[],
    citations: (s.引用查证 ?? []).filter(Boolean) as string[],
    raw: s,
  };
}

function buildListDisplay(row: SuggestionRow): WorkItemListDisplay {
  const s = row.suggestion;
  const priority = mapPriority(s.优先级);
  const pilots = loadPilotHousekeepers();
  return {
    title: actionTitle(s),
    priorityLabel: priorityDisplayLabel(priority, s.优先级),
    sourceAgent: FOLLOW_UP_SOURCE_AGENT,
    relatedObject: {
      id: row.orderNum || row.workOrderId,
      type: WORK_ORDER_OBJECT_TYPE,
    },
    sourceSystem: XLINK_SOURCE_SYSTEM,
    executorLabel: housekeeperName(pilots, row.housekeeperId),
    statusLabel: actionInboxStatusLabel(row),
    timestamp: formatListTimestamp(row.processedAt),
  };
}

/** Follow-up wedge：SuggestionRow → 平台 WorkItem */
export function mapFollowUpRow(row: SuggestionRow): WorkItem {
  const s = row.suggestion;
  const priority = mapPriority(s.优先级);

  return {
    id: row.dedupeKey,
    subjectId: row.workOrderId,
    skillId: SKILL_FOLLOW_UP as SkillId,
    assigneeId: row.housekeeperId.trim() || undefined,
    inbox: row.inboxBucket,
    priority,
    summary: opportunitySummaryPreview(s),
    statusBadges: [],
    recommendation: buildRecommendation(s),
    disposition: row.outcome
      ? {
          decision: row.outcome.decision as DispositionDecision,
          note: row.outcome.note,
          operator: row.outcome.operator,
          at: row.outcome.createdAt,
        }
      : undefined,
    metadata: {
      eventType: row.eventType,
      orderNum: row.orderNum,
      city: row.city,
      status: row.status,
      processedAt: row.processedAt,
      stateAt: row.stateAt,
      archiveReason: row.archiveReason,
      reconciledAt: row.reconciledAt,
      mongoStatus: row.mongoStatus,
      liveVerdict: row.liveVerdict,
      analyzedStaleDays: row.analyzedStaleDays,
      blockerType: row.blocker?.blockerType ?? null,
    },
    listDisplay: buildListDisplay(row),
  };
}

export function mapFollowUpRows(rows: SuggestionRow[]): WorkItem[] {
  return rows.map(mapFollowUpRow);
}
