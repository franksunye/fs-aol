import type { SuggestionDoc, SuggestionRow } from "./tracking";
import { archiveReasonLabel, decisionLabel } from "./labels";

export type ActionEntityRef = {
  id: string;
  label: string;
};

export type ActionContextFacet = {
  label: string;
  value: string;
};

export type ActionRelatedObject = {
  id: string;
  type: string;
};

export type ActionContextColumn = {
  facets: ActionContextFacet[];
};

export type ActionListDisplay = {
  title: string;
  priorityLabel: string;
  sourceAgent: ActionEntityRef;
  relatedObject: ActionRelatedObject;
  /** Action 列表「上下文」列：Agent/业务上下文的可扫视字段 */
  contextColumn?: ActionContextColumn;
  sourceSystem: ActionEntityRef;
  executorLabel: string;
  statusLabel: string;
  timestamp: string;
};

export const FOLLOW_UP_SOURCE_AGENT: ActionEntityRef = {
  id: "follow-up",
  label: "Follow-up Agent",
};

export const XLINK_SOURCE_SYSTEM: ActionEntityRef = {
  id: "xlink",
  label: "XLink",
};

export const WORK_ORDER_OBJECT_TYPE = "工单";

/** Action 标题：主行动优先，空则 fallback 原因摘要 */
export function actionTitle(s: SuggestionDoc): string {
  const primary = s.跟进方案?.主行动?.trim();
  if (primary) {
    return primary.length > 120 ? `${primary.slice(0, 119)}…` : primary;
  }
  const summary = s.原因摘要?.trim();
  if (summary) {
    return summary.length > 120 ? `${summary.slice(0, 119)}…` : summary;
  }
  return "—";
}

export function actionInboxStatusLabel(
  row: Pick<SuggestionRow, "inboxBucket" | "outcome" | "archiveReason">
): string {
  if (row.inboxBucket === "archived") {
    const reason = archiveReasonLabel(row.archiveReason);
    return reason ? `已归档` : "已归档";
  }
  if (row.outcome?.decision) {
    return decisionLabel(row.outcome.decision);
  }
  if (row.inboxBucket === "active") return "待审核";
  return "待反馈";
}

export function calendarPriorityLabel(
  priority: "high" | "medium" | "low"
): string {
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
