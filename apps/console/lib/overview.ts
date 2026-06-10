import { loadActionCenterPrimaryKpis } from "./action-center-metrics";
import type { ActionCenterPrimaryKpi } from "./action-center-nav";
import { loadAnalyticsSnapshot } from "./analytics";
import { loadActionFlowSummary } from "./action-flow-metrics";
import { MOCK_AGENTS } from "./agents-mock";
import {
  getOverviewMockData,
  OVERVIEW_KPIS,
  type OverviewAgentFleetItem,
  type OverviewAgentRunState,
  type OverviewDataSource,
  type OverviewKpi,
  type OverviewRateMetrics,
  type OverviewSnapshot,
  type OverviewTodayPulse,
} from "./overview-mock";
import { formatYuanCompact } from "./workbench-metrics";

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

function buildTodayPulse(
  analytics: Awaited<ReturnType<typeof loadAnalyticsSnapshot>>,
  fallback: OverviewTodayPulse
): OverviewTodayPulse {
  const last = analytics.trend[analytics.trend.length - 1];
  const prev = analytics.trend[analytics.trend.length - 2];
  if (!last) return fallback;

  return {
    suggestionsToday: last.discovered,
    actionsToday: last.actions,
    suggestionsDelta: prev ? last.discovered - prev.discovered : fallback.suggestionsDelta,
    actionsDelta: prev ? last.actions - prev.actions : fallback.actionsDelta,
  };
}

function buildRates(
  analytics: Awaited<ReturnType<typeof loadAnalyticsSnapshot>>,
  flow: Awaited<ReturnType<typeof loadActionFlowSummary>>,
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

  const hasLive =
    analytics.discovered > 0 || analytics.drivenAmount > 0 || flowTotal > 0;

  if (!hasLive) return fallback;

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

function agentRunState(agent: (typeof MOCK_AGENTS)[number]): OverviewAgentRunState {
  if (agent.status === "draft") return "draft";
  if (agent.status === "disabled") return "offline";
  if (agent.runsToday <= 0) return "warn";
  return "healthy";
}

function buildAgentFleet(
  fallback: OverviewAgentFleetItem[]
): OverviewAgentFleetItem[] {
  const cockpitAgents = [
    { fleetId: "follow-up", matchId: "follow-up", label: "Follow-up Agent" },
    {
      fleetId: "estimate",
      matchId: "quote-review",
      label: "Estimate Agent",
    },
    {
      fleetId: "inspection",
      matchId: "inspection-reminder",
      label: "Inspection Agent",
    },
    {
      fleetId: "collection",
      matchId: "sla-escalation",
      label: "Collection Agent",
    },
  ];

  return cockpitAgents.map((cfg) => {
    const agent = MOCK_AGENTS.find((a) => a.id === cfg.matchId);
    const fallbackItem = fallback.find((f) => f.id === cfg.fleetId);
    if (!agent) return fallbackItem!;

    const runState = agentRunState(agent);
    const statusLabel =
      runState === "healthy"
        ? "运行正常"
        : runState === "warn"
          ? "今日无运行"
          : runState === "draft"
            ? "草稿"
            : "已停用";

    const lastRun = agent.recentRuns[0]?.at ?? fallbackItem?.lastRunLabel ?? "—";

    return {
      id: cfg.fleetId,
      name: cfg.label,
      runState,
      statusLabel,
      runsToday: agent.runsToday,
      lastRunLabel: lastRun,
      agentHrefId: agent.id,
    };
  });
}

export async function loadOverviewSnapshot(
  hk?: string
): Promise<OverviewPageSnapshot> {
  const mock = getOverviewMockData(hk);

  try {
    const [primaryKpis, analytics, flow] = await Promise.all([
      loadActionCenterPrimaryKpis(hk),
      loadAnalyticsSnapshot({ rangeKey: "last_7", housekeeperId: hk }),
      loadActionFlowSummary(hk),
    ]);

    const hasKpiSignal = primaryKpis.some((k) => k.value > 0);
    const hasAnalytics =
      analytics.discovered > 0 || analytics.trend.some((p) => p.discovered > 0);
    const hasFlow = flow.dataSource !== "fallback";

    if (!hasKpiSignal && !hasAnalytics && !hasFlow) {
      return mock;
    }

    const liveFields = [hasKpiSignal, hasAnalytics, hasFlow].filter(Boolean).length;
    const dataSource: OverviewDataSource =
      liveFields >= 2 ? "live" : liveFields === 1 ? "mixed" : "mock";

    return {
      ...mock,
      kpis: hasKpiSignal ? mapPrimaryToOverviewKpis(primaryKpis) : OVERVIEW_KPIS,
      today: hasAnalytics
        ? buildTodayPulse(analytics, mock.today)
        : mock.today,
      rates: buildRates(analytics, flow, mock.rates),
      agentFleet: buildAgentFleet(mock.agentFleet),
      dataSource,
    };
  } catch (err) {
    console.error("[overview] loadOverviewSnapshot failed, using mock", err);
    return { ...mock, dataSource: "mock" };
  }
}
