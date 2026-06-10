/** Action 流转生命周期状态（运营视角） */
export type ActionFlowStatus =
  | "pending_dispatch"
  | "dispatched"
  | "in_progress"
  | "completed"
  | "rejected"
  | "timeout"
  | "no_feedback";

export const ACTION_FLOW_STATUS_LABELS: Record<ActionFlowStatus, string> = {
  pending_dispatch: "待分发",
  dispatched: "已分发",
  in_progress: "执行中",
  completed: "已完成",
  rejected: "已拒绝",
  timeout: "已超时",
  no_feedback: "无反馈",
};

export type ClosedLoopFilter =
  | "all"
  | "completed"
  | "rejected"
  | "expired"
  | "archived";

export const CLOSED_LOOP_FILTER_LABELS: Record<ClosedLoopFilter, string> = {
  all: "全部",
  completed: "已完成",
  rejected: "已拒绝",
  expired: "已失效",
  archived: "已归档",
};

export function parseClosedLoopFilter(
  value?: string | null
): ClosedLoopFilter {
  const v = value?.trim();
  if (
    v === "completed" ||
    v === "rejected" ||
    v === "expired" ||
    v === "archived"
  ) {
    return v;
  }
  return "all";
}
