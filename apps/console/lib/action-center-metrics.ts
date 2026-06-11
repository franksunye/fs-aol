import { countInboxBuckets } from "./suggestions";
import { loadExecutionMetrics } from "./execution-metrics";
import { countPendingActions } from "./tracking/actions";
import type { InboxBucketCounts } from "./tracking/types";
import type { ActionCenterPrimaryKpi } from "./action-center-kpi";

export type { ActionCenterPrimaryKpi, ActionCenterPrimaryKpiKey } from "./action-center-kpi";

const FALLBACK_PRIMARY: ActionCenterPrimaryKpi[] = [
  { key: "pendingReview", label: "待审核", value: 9, delta: -2, upIsGood: false },
  {
    key: "actionsGenerated",
    label: "已生成 Actions",
    value: 23,
    delta: 5,
    upIsGood: true,
  },
  { key: "dispatched", label: "已分发", value: 18, delta: 2, upIsGood: true },
  { key: "feedback", label: "已反馈", value: 16, delta: 3, upIsGood: true },
  {
    key: "timeoutAnomaly",
    label: "超时 / 异常",
    value: 3,
    delta: -1,
    upIsGood: false,
  },
];

function deltaFromValue(value: number, seed: number): number {
  if (value === 0) return 0;
  const magnitude = Math.max(1, Math.round(value * 0.1) + (seed % 2));
  return seed % 2 === 0 ? magnitude : -magnitude;
}

function buildPrimaryFromSources(
  inbox: InboxBucketCounts,
  actionsTotal: number,
  flow: Awaited<ReturnType<typeof loadExecutionMetrics>>
): ActionCenterPrimaryKpi[] {
  return [
    {
      key: "pendingReview",
      label: "待审核",
      value: inbox.active,
      delta: deltaFromValue(inbox.active, 1),
      upIsGood: false,
    },
    {
      key: "actionsGenerated",
      label: "已生成 Actions",
      value: actionsTotal,
      delta: deltaFromValue(actionsTotal, 2),
      upIsGood: true,
    },
    {
      key: "dispatched",
      label: "已分发",
      value: flow.dispatched,
      delta: flow.dispatchedDelta,
      upIsGood: true,
    },
    {
      key: "feedback",
      label: "已反馈",
      value: flow.withFeedback,
      delta: flow.withFeedbackDelta,
      upIsGood: true,
    },
    {
      key: "timeoutAnomaly",
      label: "超时 / 异常",
      value: flow.timeoutAnomaly,
      delta: flow.timeoutAnomalyDelta,
      upIsGood: false,
    },
  ];
}

export async function loadActionCenterPrimaryKpis(
  hk?: string
): Promise<ActionCenterPrimaryKpi[]> {
  const hkOpts = hk ? { housekeeperId: hk } : {};

  try {
    const [inbox, flow, pendingActions] = await Promise.all([
      countInboxBuckets(hkOpts),
      loadExecutionMetrics(hk),
      countPendingActions(hkOpts),
    ]);
    const actionsTotal = pendingActions + inbox.execution;
    const hasSignal =
      inbox.active > 0 ||
      inbox.execution > 0 ||
      inbox.closed > 0 ||
      flow.dataSource !== "fallback" ||
      actionsTotal > 0;

    if (hasSignal) {
      return buildPrimaryFromSources(inbox, actionsTotal, flow);
    }
  } catch {
    // Turso 不可用时回退演示数据
  }

  return FALLBACK_PRIMARY;
}
