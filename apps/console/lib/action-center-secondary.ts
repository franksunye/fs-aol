import { formatYuanCompact } from "./action-review-metric-cards";
import type { ActionReviewMetricCards } from "./action-review-metric-cards";
import type { ExecutionMetricsResult } from "./execution-metrics";
import { executionStatusHref } from "./action-execution-mock";
export type SecondaryMetricItem = {
  key: string;
  label: string;
  value: number | string;
  href?: string;
  active?: boolean;
  tone?: "default" | "warn" | "danger";
};

export function buildFlowSecondaryMetrics(
  summary: ExecutionMetricsResult,
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
      href: executionStatusHref("pending_dispatch", hk),
      active: !isOverdueActive && status === "pending_dispatch",
    },
    {
      key: "dispatched",
      label: "已分发",
      value: summary.dispatched,
      href: executionStatusHref("dispatched", hk),
      active: !isOverdueActive && status === "dispatched",
    },
    {
      key: "in_progress",
      label: "执行中",
      value: summary.inProgress,
      href: executionStatusHref("in_progress", hk),
      active: !isOverdueActive && status === "in_progress",
    },
    {
      key: "with_feedback",
      label: "已反馈",
      value: summary.withFeedback,
      href: executionStatusHref("completed", hk),
      active: !isOverdueActive && status === "completed",
    },
    {
      key: "timeout_anomaly",
      label: "超时/异常",
      value: summary.timeoutAnomaly,
      href: executionStatusHref("timeout_anomaly", hk),
      active: isOverdueActive,
      tone: summary.timeoutAnomaly > 0 ? "danger" : "default",
    },
  ];
}

export function buildReviewSecondaryMetrics(
  metrics: ActionReviewMetricCards,
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
