import { formatYuanCompact } from "./workbench-metrics";
import type { WorkbenchMetricCards } from "./workbench-metrics";
import type { ActionFlowSummaryResult } from "./action-flow-metrics";
import { actionFlowStatusHref } from "./my-actions-mock";
export type SecondaryMetricItem = {
  key: string;
  label: string;
  value: number | string;
  href?: string;
  active?: boolean;
  tone?: "default" | "warn" | "danger";
};

export function buildFlowSecondaryMetrics(
  summary: ActionFlowSummaryResult,
  hk?: string,
  active?: { status?: string | null; quick?: string | null }
): SecondaryMetricItem[] {
  const isOverdueActive = active?.quick === "overdue";
  const status = active?.status?.trim();

  return [
    {
      key: "pending_dispatch",
      label: "待分发",
      value: summary.pendingDispatch,
      href: actionFlowStatusHref("pending_dispatch", hk),
      active: !isOverdueActive && status === "pending_dispatch",
    },
    {
      key: "dispatched",
      label: "已分发",
      value: summary.dispatched,
      href: actionFlowStatusHref("dispatched", hk),
      active: !isOverdueActive && status === "dispatched",
    },
    {
      key: "in_progress",
      label: "执行中",
      value: summary.inProgress,
      href: actionFlowStatusHref("in_progress", hk),
      active: !isOverdueActive && status === "in_progress",
    },
    {
      key: "with_feedback",
      label: "已反馈",
      value: summary.withFeedback,
      href: actionFlowStatusHref("completed", hk),
      active: !isOverdueActive && status === "completed",
    },
    {
      key: "timeout_anomaly",
      label: "超时/异常",
      value: summary.timeoutAnomaly,
      href: actionFlowStatusHref("timeout_anomaly", hk),
      active: isOverdueActive,
      tone: summary.timeoutAnomaly > 0 ? "danger" : "default",
    },
  ];
}

export function buildReviewSecondaryMetrics(
  metrics: WorkbenchMetricCards,
  hk?: string,
  priority?: string | null
): SecondaryMetricItem[] {
  const q = (extra: Record<string, string>) => {
    const params = new URLSearchParams(extra);
    if (hk) params.set("hk", hk);
    return `/?${params.toString()}`;
  };

  const items: SecondaryMetricItem[] = [
    {
      key: "high",
      label: "高优先级",
      value: metrics.highPriority,
      href: q({ priority: "高" }),
      active: priority === "高",
      tone: metrics.highPriority > 0 ? "warn" : "default",
    },
    {
      key: "today_new",
      label: "今日新进",
      value: metrics.todayNewInPool,
    },
    {
      key: "quoted",
      label: "含报价",
      value: metrics.quotedCount,
    },
  ];

  if (metrics.pushableAmount > 0) {
    items.push({
      key: "amount",
      label: "可推动金额",
      value: formatYuanCompact(metrics.pushableAmount),
    });
  }

  return items;
}
