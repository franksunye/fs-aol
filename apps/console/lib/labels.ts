export const EVENT_TYPE_LABELS: Record<string, string> = {
  STALE_SIGN_PENDING: "待签约停滞",
  STALE_VISIT_NO_DEAL: "上门未成交停滞",
  PAYMENT_PENDING: "待支付停滞",
  COMPLETED_CARE: "完工关怀",
};

export function eventTypeLabel(eventType: string): string {
  return EVENT_TYPE_LABELS[eventType] || eventType || "跟进事件";
}

export const STATUS_LABELS: Record<string, string> = {
  sent: "已推送",
  skipped_no_follow_up: "无需跟进",
  send_failed: "推送失败",
  reanalyzed: "再分析已推送",
  reanalyzed_no_push: "再分析未推送",
  reanalyzed_send_failed: "再分析推送失败",
  reanalyzed_skipped_no_follow_up: "再分析·无需跟进",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status || "—";
}

export const DECISION_LABELS: Record<string, string> = {
  approved: "已同意",
  rejected: "已拒绝",
  modified: "已修改",
  followed_up: "已跟进",
};

export function decisionLabel(decision?: string | null): string {
  if (!decision) return "待反馈";
  return DECISION_LABELS[decision] || decision;
}

/** 优先级 → badge 颜色类（基于 shadcn token / 自定义优先级色）。 */
export function priorityClasses(priority?: string): string {
  switch (priority) {
    case "高":
      return "border-transparent bg-red-500/15 text-red-400";
    case "中":
      return "border-transparent bg-amber-500/15 text-amber-400";
    case "低":
      return "border-transparent bg-emerald-500/15 text-emerald-400";
    default:
      return "border-transparent bg-muted text-muted-foreground";
  }
}

export function decisionClasses(decision?: string | null): string {
  switch (decision) {
    case "approved":
      return "border-transparent bg-emerald-500/15 text-emerald-400";
    case "rejected":
      return "border-transparent bg-red-500/15 text-red-400";
    case "modified":
      return "border-transparent bg-blue-500/15 text-blue-400";
    case "followed_up":
      return "border-transparent bg-violet-500/15 text-violet-400";
    default:
      return "border-transparent bg-amber-500/15 text-amber-400";
  }
}

export function encodeKey(key: string): string {
  return encodeURIComponent(key);
}

export type InboxBucket = "active" | "execution" | "closed" | "archived";

export const INBOX_TAB_LABELS: Record<InboxBucket, string> = {
  active: "待审核",
  execution: "待执行",
  closed: "已闭环",
  archived: "已归档",
};

export const ARCHIVE_REASON_LABELS: Record<string, string> = {
  awaiting_execution: "待执行",
  action_completed: "执行已完成",
  has_outcome: "已有处置反馈",
  agent_no_follow: "Agent 判定无需跟进",
  left_wedge: "已离开跟进楔子（非待签约等触发状态）",
  signed_contract: "已有生效签约",
  paid_and_signed: "已签约且已支付",
  mongo_missing: "Mongo 无此工单",
};

export function archiveReasonLabel(reason?: string | null): string {
  if (!reason) return "";
  return ARCHIVE_REASON_LABELS[reason] || reason;
}

export function parseInboxBucket(
  value?: string | null
): InboxBucket | undefined {
  const v = value?.trim();
  if (
    v === "active" ||
    v === "execution" ||
    v === "closed" ||
    v === "archived"
  ) {
    return v;
  }
  return undefined;
}

/** 首页 searchParams → 收件箱 tab（须在 Server Component 使用，勿放在 client 文件）。 */
export function inboxTabFromSearchParams(sp: {
  tab?: string;
}): InboxBucket {
  return parseInboxBucket(sp.tab) ?? "active";
}
