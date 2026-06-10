import {
  formatDeltaPercent,
  loadAnalyticsSnapshot,
  parseAnalyticsRangeKey,
  type AnalyticsRangeKey,
} from "./analytics";
import {
  EVALUATION_RANGE_OPTIONS,
  formatEvaluationYuan,
  getEvaluationSnapshot,
  type EvaluationFilters,
  type EvaluationKpi,
  type EvaluationSnapshot,
  type EvaluationTrendPoint,
} from "./evaluation-mock";

export type EvaluationDataSource = "live" | "mock" | "mixed";

export type EvaluationPageSnapshot = EvaluationSnapshot & {
  dataSource: EvaluationDataSource;
  rangeLabel: string;
  /** Turso/库内统计加载失败时为 true，页面仍展示 mock */
  analyticsLoadFailed?: boolean;
};

function rangeLabelFor(filters: EvaluationFilters): string {
  return (
    EVALUATION_RANGE_OPTIONS.find((o) => o.id === filters.range)?.label ??
    "近 7 天"
  );
}

function mapRangeKey(range: EvaluationFilters["range"]): AnalyticsRangeKey {
  return parseAnalyticsRangeKey(range);
}

function buildKpiDelta(
  current: number,
  previous: number,
  suffix = "%"
): Pick<EvaluationKpi, "deltaText" | "tone"> {
  const delta = formatDeltaPercent(current, previous);
  const text =
    suffix === "pp" && delta.tone !== "na" && delta.tone !== "flat"
      ? delta.text.replace("%", "pp")
      : delta.text.replace("较上期", "较前 7 天");
  return {
    deltaText: text,
    tone: delta.tone === "na" ? "flat" : delta.tone,
  };
}

function mergeKpis(
  mockKpis: EvaluationKpi[],
  analytics: Awaited<ReturnType<typeof loadAnalyticsSnapshot>>
): EvaluationKpi[] {
  const hasLive = analytics.discovered > 0 || analytics.actions > 0;
  if (!hasLive) return mockKpis;

  const adoption =
    analytics.discovered > 0
      ? Math.round((analytics.actions / analytics.discovered) * 100)
      : 0;
  const prevAdoption =
    analytics.prevDiscovered > 0
      ? Math.round((analytics.prevActions / analytics.prevDiscovered) * 100)
      : 0;

  const prevSuccessRate =
    analytics.prevDiscovered > 0
      ? Math.round((analytics.prevActions / analytics.prevDiscovered) * 100)
      : 0;

  return mockKpis.map((kpi) => {
    switch (kpi.key) {
      case "accuracy": {
        const delta = buildKpiDelta(
          analytics.successRate,
          prevSuccessRate,
          "pp"
        );
        return {
          ...kpi,
          value: `${analytics.successRate}%`,
          deltaText: delta.deltaText.replace("%", "pp"),
          tone: delta.tone,
        };
      }
      case "adoption": {
        const delta = buildKpiDelta(adoption, prevAdoption, "pp");
        return {
          ...kpi,
          value: `${adoption}%`,
          deltaText: delta.deltaText.replace("%", "pp"),
          tone: delta.tone,
        };
      }
      default:
        return kpi;
    }
  });
}

function mergeOpsMetrics(
  mockOps: EvaluationPageSnapshot["opsMetrics"],
  analytics: Awaited<ReturnType<typeof loadAnalyticsSnapshot>>
): EvaluationPageSnapshot["opsMetrics"] {
  const hasLive = analytics.discovered > 0 || analytics.drivenAmount > 0;
  if (!hasLive) return mockOps;

  return mockOps.map((metric) => {
    if (metric.key !== "conversionIncrement" || analytics.drivenAmount <= 0) {
      return metric;
    }
    const delta = buildKpiDelta(
      analytics.drivenAmount,
      analytics.prevDrivenAmount,
      ""
    );
    return {
      ...metric,
      value: formatEvaluationYuan(analytics.drivenAmount),
      deltaText:
        delta.tone === "flat"
          ? "较前 7 天 持平"
          : delta.deltaText.replace("pp", "%"),
      tone: delta.tone,
    };
  });
}

function mergeSuggestionTrend(
  mockTrend: EvaluationTrendPoint[],
  analytics: Awaited<ReturnType<typeof loadAnalyticsSnapshot>>
): EvaluationTrendPoint[] {
  const hasData = analytics.trend.some((p) => p.discovered > 0);
  if (!hasData) return mockTrend;
  return analytics.trend.map((p) => ({
    label: p.label,
    value: p.discovered,
  }));
}

export async function loadEvaluationSnapshot(options: {
  filters: EvaluationFilters;
  housekeeperId?: string;
}): Promise<EvaluationPageSnapshot> {
  const mock = getEvaluationSnapshot(options.filters);

  try {
    const analytics = await loadAnalyticsSnapshot({
      rangeKey: mapRangeKey(options.filters.range),
      housekeeperId: options.housekeeperId,
    });

    const kpis = mergeKpis(mock.kpis, analytics);
    const opsMetrics = mergeOpsMetrics(mock.opsMetrics, analytics);
    const suggestionTrend = mergeSuggestionTrend(
      mock.suggestionTrend,
      analytics
    );

    const liveFields =
      (analytics.discovered > 0 ? 1 : 0) +
      (analytics.drivenAmount > 0 ? 1 : 0) +
      (suggestionTrend !== mock.suggestionTrend ? 1 : 0);

    const dataSource: EvaluationDataSource =
      liveFields === 0
        ? "mock"
        : liveFields >= 3
          ? "live"
          : "mixed";

    return {
      ...mock,
      kpis,
      opsMetrics,
      suggestionTrend,
      dataSource,
      rangeLabel: analytics.range.label,
    };
  } catch (err) {
    console.error("[evaluation] loadAnalyticsSnapshot failed, using mock", err);
    return {
      ...mock,
      dataSource: "mock",
      rangeLabel: rangeLabelFor(options.filters),
      analyticsLoadFailed: true,
    };
  }
}
