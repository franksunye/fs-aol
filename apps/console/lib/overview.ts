import { loadActionCenterPrimaryKpis } from "./action-center-metrics";
import type { ActionCenterPrimaryKpi } from "./action-center-nav";
import { loadAnalyticsSnapshot } from "./analytics";
import { loadActionFlowSummary } from "./action-flow-metrics";
import {
  getOverviewMockData,
  OVERVIEW_KPIS,
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

function todayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 库内样本过少时，效率/今日产出仍用演示数据，避免驾驶舱出现 9% 采纳率等误导数字 */
function hasMeaningfulAnalytics(
  analytics: Awaited<ReturnType<typeof loadAnalyticsSnapshot>>
): boolean {
  const weekTotal = analytics.trend.reduce(
    (sum, p) => sum + p.discovered,
    0
  );
  return analytics.discovered >= 12 && weekTotal >= 20;
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

    const meaningfulAnalytics = hasMeaningfulAnalytics(analytics);
    const useLiveRates = meaningfulAnalytics;
    const useLiveToday = meaningfulAnalytics;

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
        ? buildTodayPulse(analytics, mock.today)
        : mock.today,
      rates: useLiveRates
        ? buildRates(analytics, flow, mock.rates)
        : mock.rates,
      // 驾驶舱 Agent 状态用运营向演示数据，避免 Agents 配置页「已停用」直接暴露到总览
      agentFleet: mock.agentFleet,
      dataSource,
    };
  } catch (err) {
    console.error("[overview] loadOverviewSnapshot failed, using mock", err);
    return { ...mock, dataSource: "mock" };
  }
}
