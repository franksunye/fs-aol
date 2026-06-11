import { loadActionCenterPrimaryKpis } from "./action-center-metrics";
import type { ActionCenterPrimaryKpi } from "./action-center-kpi";
import { loadAnalyticsSnapshot } from "./analytics";
import { loadExecutionMetrics } from "./execution-metrics";
import { actionCenterTabHref } from "./action-center-nav";
import {
  overviewActionsHref,
  overviewAnomalyHref,
  overviewPendingReviewHref,
} from "./overview-nav";
import { countPendingActions } from "./tracking/actions";
import { countInboxBuckets } from "./tracking/inbox";
import { getLatestEngineRuntimeSnapshot } from "./tracking/engine-runtime";
import {
  getOverviewMockData,
  OVERVIEW_KPIS,
  type OverviewAttentionItem,
  type OverviewDataSource,
  type OverviewIntegrationHealth,
  type OverviewKpi,
  type OverviewRateMetrics,
  type OverviewSnapshot,
  type OverviewTodayPulse,
  type OverviewTrendPoint,
} from "./overview-mock";
import { formatYuanCompact } from "./action-review-metric-cards";

export type OverviewPageSnapshot = OverviewSnapshot;

export { formatYuanCompact };

function mapPrimaryToOverviewKpis(
  primary: ActionCenterPrimaryKpi[]
): OverviewKpi[] {
  return primary.map((p) => ({
    key: p.key,
    label: p.label,
    value: p.value,
    delta: p.delta,
    upIsGood: p.upIsGood,
  }));
}

function todayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** v0.4.1：试点样本较少时也展示 live，附脚注说明 */
function hasMeaningfulAnalytics(
  analytics: Awaited<ReturnType<typeof loadAnalyticsSnapshot>>
): boolean {
  return analytics.discovered >= 4;
}

function buildLiveTrend(
  analytics: Awaited<ReturnType<typeof loadAnalyticsSnapshot>>
): OverviewTrendPoint[] {
  return analytics.trend.map((p) => ({
    date: p.date,
    label: p.label,
    suggestions: p.discovered,
    actions: p.actions,
  }));
}

function buildLiveAttentionItems(
  hk: string | undefined,
  buckets: Awaited<ReturnType<typeof countInboxBuckets>>,
  pendingExecution: number,
  timeoutAnomaly: number
): OverviewAttentionItem[] {
  const items: OverviewAttentionItem[] = [];
  if (buckets.active > 0) {
    items.push({
      id: "pending-review",
      title: "待审核建议",
      description: `${buckets.active} 条建议等待人工审核`,
      badge: buckets.active,
      badgeTone: buckets.active >= 5 ? "danger" : "warn",
      href: overviewPendingReviewHref(hk),
    });
  }
  if (pendingExecution > 0) {
    items.push({
      id: "pending-execution",
      title: "待执行 Action",
      description: `${pendingExecution} 条 Action 等待管家执行反馈`,
      badge: pendingExecution,
      badgeTone: "warn",
      href: actionCenterTabHref({ hk, from: "execution" }),
    });
  }
  if (timeoutAnomaly > 0) {
    items.push({
      id: "timeout-anomaly",
      title: "超时 / 异常 Action",
      description: `${timeoutAnomaly} 条需关注`,
      badge: timeoutAnomaly,
      badgeTone: "danger",
      href: overviewAnomalyHref(hk),
    });
  }
  if (buckets.closed > 0) {
    items.push({
      id: "closed-loop",
      title: "已闭环记录",
      description: `${buckets.closed} 条可复盘`,
      href: actionCenterTabHref({ hk, from: "closed" }),
    });
  }
  return items.length > 0 ? items : [];
}

async function buildIntegrationHealthFromSnapshot(): Promise<
  OverviewIntegrationHealth[]
> {
  const snap = await getLatestEngineRuntimeSnapshot();
  if (!snap) {
    return [];
  }
  const s = snap.snapshot;
  const items: OverviewIntegrationHealth[] = [];
  if (s.fsm_mongo_configured) {
    items.push({
      id: "xlink-mongo",
      name: "XLink Mongo",
      status: String(s.fsm_mongo_db || "已配置"),
      healthPct: 100,
    });
  }
  items.push({
    id: "turso",
    name: "Turso Tracking",
    status: "运行正常",
    healthPct: 100,
  });
  items.push({
    id: "wecom",
    name: "企业微信",
    status: s.wecom_configured
      ? s.dry_run
        ? "DRY_RUN 预览"
        : "已配置"
      : "未配置",
    healthPct: s.wecom_configured ? 95 : 0,
    statusTone: s.wecom_configured ? "normal" : "warn",
  });
  return items;
}

function buildTodayPulse(
  analytics: Awaited<ReturnType<typeof loadAnalyticsSnapshot>>,
  fallback: OverviewTodayPulse
): OverviewTodayPulse {
  const todayKey = todayDateKey();
  const todayPoint =
    analytics.trend.find((p) => p.date === todayKey) ??
    analytics.trend[analytics.trend.length - 1];
  const prev = analytics.trend[analytics.trend.length - 2];
  if (!todayPoint) return fallback;

  // 今日样本过少时保留演示值，避免「建议 1 / Actions 0」破坏驾驶舱可读性
  if (todayPoint.discovered < 3 && todayPoint.actions < 2) {
    return fallback;
  }

  return {
    suggestionsToday: todayPoint.discovered,
    actionsToday: todayPoint.actions,
    suggestionsDelta: prev
      ? todayPoint.discovered - prev.discovered
      : fallback.suggestionsDelta,
    actionsDelta: prev ? todayPoint.actions - prev.actions : fallback.actionsDelta,
  };
}

function buildRates(
  analytics: Awaited<ReturnType<typeof loadAnalyticsSnapshot>>,
  flow: Awaited<ReturnType<typeof loadExecutionMetrics>>,
  fallback: OverviewRateMetrics
): OverviewRateMetrics {
  const adoption =
    analytics.discovered > 0
      ? Math.round((analytics.actions / analytics.discovered) * 100)
      : fallback.adoptionRate;
  const prevAdoption =
    analytics.prevDiscovered > 0
      ? Math.round((analytics.prevActions / analytics.prevDiscovered) * 100)
      : adoption - fallback.adoptionDeltaPp;

  const flowTotal =
    flow.dispatched +
    flow.inProgress +
    flow.withFeedback +
    flow.timeoutAnomaly +
    flow.pendingDispatch;
  const feedbackRate =
    flowTotal > 0
      ? Math.round((flow.withFeedback / flowTotal) * 100)
      : fallback.feedbackRate;
  const timeoutRate =
    flowTotal > 0
      ? Math.round((flow.timeoutAnomaly / flowTotal) * 100)
      : fallback.timeoutRate;

  if (!hasMeaningfulAnalytics(analytics)) return fallback;

  return {
    adoptionRate: adoption,
    adoptionDeltaPp: adoption - prevAdoption,
    feedbackRate,
    feedbackDeltaPp: fallback.feedbackDeltaPp,
    timeoutRate,
    timeoutDeltaPp: fallback.timeoutDeltaPp,
    businessValue:
      analytics.drivenAmount > 0
        ? analytics.drivenAmount
        : fallback.businessValue,
    businessValueDeltaPct:
      analytics.prevDrivenAmount > 0
        ? Math.round(
            ((analytics.drivenAmount - analytics.prevDrivenAmount) /
              analytics.prevDrivenAmount) *
              100
          )
        : fallback.businessValueDeltaPct,
  };
}

export async function loadOverviewSnapshot(
  hk?: string
): Promise<OverviewPageSnapshot> {
  const mock = getOverviewMockData(hk);

  try {
    const [primaryKpis, analytics, flow, pendingExecution, buckets, engineSnap] =
      await Promise.all([
        loadActionCenterPrimaryKpis(hk),
        loadAnalyticsSnapshot({ rangeKey: "last_7", housekeeperId: hk }),
        loadExecutionMetrics(hk),
        countPendingActions(hk ? { housekeeperId: hk } : {}),
        countInboxBuckets(hk ? { housekeeperId: hk } : {}),
        getLatestEngineRuntimeSnapshot(),
      ]);

    const hasKpiSignal = primaryKpis.some((k) => k.value > 0);
    const hasAnalytics =
      analytics.discovered > 0 || analytics.trend.some((p) => p.discovered > 0);
    const hasFlow = flow.dataSource !== "fallback";

    if (!hasKpiSignal && !hasAnalytics && !hasFlow) {
      return mock;
    }

    const meaningfulAnalytics = hasMeaningfulAnalytics(analytics);
    const useLiveRates = meaningfulAnalytics || hasKpiSignal;
    const useLiveToday = meaningfulAnalytics || hasAnalytics;

    const liveTrend =
      analytics.trend.some((p) => p.discovered > 0 || p.actions > 0)
        ? buildLiveTrend(analytics)
        : mock.trend;

    const liveAttention = buildLiveAttentionItems(
      hk,
      buckets,
      pendingExecution,
      flow.timeoutAnomaly
    );

    const liveIntegration = await buildIntegrationHealthFromSnapshot();
    const traceRunsToday = engineSnap?.runSummary
      ? Number(
          (engineSnap.runSummary as { success?: number }).success ??
            analytics.traceCost.runCount
        )
      : analytics.traceCost.runCount;

    const agentFleet = mock.agentFleet.map((agent) =>
      agent.id === "follow-up"
        ? {
            ...agent,
            runState: traceRunsToday > 0 ? ("healthy" as const) : agent.runState,
            runsToday: traceRunsToday,
            lastRunLabel: engineSnap?.runAt
              ? engineSnap.runAt.slice(0, 16).replace("T", " ")
              : agent.lastRunLabel,
          }
        : agent
    );

    const liveTopAgents = mock.topAgents.map((agent) =>
      agent.id === "follow-up"
        ? {
            ...agent,
            closedActions: buckets.closed,
            adoptionRate:
              analytics.discovered > 0
                ? Math.round((analytics.actions / analytics.discovered) * 100)
                : agent.adoptionRate,
          }
        : agent
    );

    const ac = analytics.actionCompletion;
    const actionTotal = ac.total || mock.actionStatus.total;
    const liveActionStatus =
      ac.total > 0
        ? {
            total: actionTotal,
            slices: [
              {
                key: "completed",
                label: "已完成",
                count: ac.completed,
                percent: Math.round((ac.completed / actionTotal) * 100),
                color: "oklch(0.596 0.145 163.225)",
              },
              {
                key: "pending",
                label: "待执行",
                count: ac.pending,
                percent: Math.round((ac.pending / actionTotal) * 100),
                color: "oklch(0.623 0.214 259.815)",
              },
              {
                key: "timeout",
                label: "超时",
                count: ac.timeout,
                percent: Math.round((ac.timeout / actionTotal) * 100),
                color: "oklch(0.637 0.237 25.331)",
              },
            ],
          }
        : mock.actionStatus;

    const dataSource: OverviewDataSource =
      hasKpiSignal && useLiveRates
        ? "live"
        : hasKpiSignal
          ? "mixed"
          : "mock";

    return {
      ...mock,
      kpis: hasKpiSignal ? mapPrimaryToOverviewKpis(primaryKpis) : OVERVIEW_KPIS,
      today: useLiveToday
        ? {
            ...buildTodayPulse(analytics, mock.today),
            actionsToday: Math.max(
              buildTodayPulse(analytics, mock.today).actionsToday,
              pendingExecution
            ),
          }
        : mock.today,
      rates: useLiveRates
        ? buildRates(analytics, flow, mock.rates)
        : mock.rates,
      agentFleet,
      trend: liveTrend,
      actionStatus: liveActionStatus,
      topAgents: liveTopAgents,
      integrationHealth:
        liveIntegration.length > 0 ? liveIntegration : mock.integrationHealth,
      attentionItems:
        liveAttention.length > 0 ? liveAttention : mock.attentionItems,
      dataSource,
    };
  } catch (err) {
    console.error("[overview] loadOverviewSnapshot failed, using mock", err);
    return { ...mock, dataSource: "mock" };
  }
}
