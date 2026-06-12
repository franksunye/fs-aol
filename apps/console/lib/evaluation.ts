import { db, ensureSchema, TABLE_LOGS, TABLE_OUTCOMES } from "./db";
import {
  formatDeltaPercent,
  loadAnalyticsSnapshot,
  parseAnalyticsRangeKey,
  type AnalyticsRangeKey,
  type AnalyticsSnapshot,
} from "./analytics";
import {
  EVALUATION_RANGE_OPTIONS,
  formatEvaluationYuan,
  getEvaluationSnapshot,
  type EvaluationFilters,
  type EvaluationKpi,
  type EvaluationQualitySample,
  type EvaluationSnapshot,
  type EvaluationTrendPoint,
} from "./evaluation-mock";
import { FOLLOW_UP_SKILL } from "./skills";

const FOLLOW_UP_AGENT_NAME = FOLLOW_UP_SKILL.productName;

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

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

function mergeKpis(
  mockKpis: EvaluationKpi[],
  analytics: AnalyticsSnapshot
): EvaluationKpi[] {
  const hasLive = analytics.discovered > 0 || analytics.actions > 0;
  if (!hasLive) return mockKpis;

  const adoption = pct(analytics.actions, analytics.discovered);
  const prevAdoption = pct(analytics.prevActions, analytics.prevDiscovered);
  const prevSuccessRate = prevAdoption;
  const ob = analytics.outcomeBreakdown;
  const totalOutcomes =
    ob.approved + ob.modified + ob.rejected + ob.followed_up;
  const prevTotalOutcomes =
    ob.prevApproved +
    ob.prevModified +
    ob.prevRejected +
    ob.prevFollowedUp;
  const modifiedRate = pct(ob.modified, totalOutcomes);
  const prevModifiedRate = pct(ob.prevModified, prevTotalOutcomes);
  const rejectedRate = pct(ob.rejected, totalOutcomes);
  const prevRejectedRate = pct(ob.prevRejected, prevTotalOutcomes);
  const completionRate = pct(
    analytics.actionCompletion.completed,
    analytics.actionCompletion.total
  );
  const prevCompletionRate = pct(
    analytics.actionCompletion.prevCompleted,
    analytics.actionCompletion.prevTotal
  );
  const feedbackRate = completionRate;
  const prevFeedbackRate = prevCompletionRate;

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
      case "modified": {
        const delta = buildKpiDelta(modifiedRate, prevModifiedRate, "pp");
        return {
          ...kpi,
          value: `${modifiedRate}%`,
          deltaText: delta.deltaText.replace("%", "pp"),
          tone: delta.tone,
        };
      }
      case "rejected": {
        const delta = buildKpiDelta(rejectedRate, prevRejectedRate, "pp");
        return {
          ...kpi,
          value: `${rejectedRate}%`,
          deltaText: delta.deltaText.replace("%", "pp"),
          tone: delta.tone,
        };
      }
      case "completion": {
        const delta = buildKpiDelta(completionRate, prevCompletionRate, "pp");
        return {
          ...kpi,
          value: `${completionRate}%`,
          deltaText: delta.deltaText.replace("%", "pp"),
          tone: delta.tone,
        };
      }
      case "feedback": {
        const delta = buildKpiDelta(feedbackRate, prevFeedbackRate, "pp");
        return {
          ...kpi,
          value: `${feedbackRate}%`,
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
  analytics: AnalyticsSnapshot
): EvaluationPageSnapshot["opsMetrics"] {
  const hasLive =
    analytics.discovered > 0 ||
    analytics.drivenAmount > 0 ||
    analytics.traceCost.runCount > 0;
  if (!hasLive) return mockOps;

  const tc = analytics.traceCost;
  const estCostYuan = Math.round((tc.totalTokens / 1000) * 0.02 * 100) / 100;

  return mockOps.map((metric) => {
    if (metric.key === "conversionIncrement" && analytics.drivenAmount > 0) {
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
    }
    if (metric.key === "latency" && tc.runCount > 0) {
      const delta = buildKpiDelta(tc.avgLatencyMs, tc.prevAvgLatencyMs, "");
      return {
        ...metric,
        value: `${(tc.avgLatencyMs / 1000).toFixed(1)}s`,
        deltaText:
          delta.tone === "flat"
            ? "较前 7 天 持平"
            : delta.deltaText.replace("%", "ms"),
        tone: delta.tone,
      };
    }
    if (metric.key === "cost" && tc.runCount > 0) {
      return {
        ...metric,
        value: `¥${estCostYuan.toFixed(2)}`,
        deltaText: "基于 token 估算",
        tone: "flat" as const,
      };
    }
    return metric;
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

async function loadQualitySamplesFromDb(
  limit = 5
): Promise<EvaluationQualitySample[]> {
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT o.decision, o.created_at, o.note, l.order_num, l.dedupe_key
          FROM ${TABLE_OUTCOMES} o
          INNER JOIN ${TABLE_LOGS} l ON l.dedupe_key = o.dedupe_key
          WHERE o.decision IN ('rejected', 'modified')
          ORDER BY o.created_at DESC
          LIMIT ?`,
    args: [limit],
  });
  return (res.rows as unknown as Record<string, unknown>[]).map((row) => {
    const decision = String(row.decision ?? "");
    const tag =
      decision === "rejected"
        ? ("rejected" as const)
        : ("needs_edit" as const);
    return {
      time: String(row.created_at ?? "").slice(0, 16).replace("T", " "),
      agentName: FOLLOW_UP_AGENT_NAME,
      actionLabel: String(row.order_num ?? "工单"),
      issue: decision === "rejected" ? "管家拒绝建议" : "管家修改后采纳",
      suggestion: String(row.note ?? "—"),
      tag,
      severity: "medium" as const,
      workOrderKey: String(row.dedupe_key ?? ""),
    };
  });
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
    const liveSamples = await loadQualitySamplesFromDb(5);
    const qualitySamples =
      liveSamples.length > 0 ? liveSamples : mock.qualitySamples;

    const liveFields =
      (analytics.discovered > 0 ? 1 : 0) +
      (analytics.outcomeBreakdown.rejected +
        analytics.outcomeBreakdown.modified >
      0
        ? 1
        : 0) +
      (analytics.actionCompletion.total > 0 ? 1 : 0) +
      (analytics.traceCost.runCount > 0 ? 1 : 0) +
      (suggestionTrend !== mock.suggestionTrend ? 1 : 0);

    const dataSource: EvaluationDataSource =
      liveFields === 0
        ? "mock"
        : liveFields >= 4
          ? "live"
          : "mixed";

    return {
      ...mock,
      kpis,
      opsMetrics,
      suggestionTrend,
      qualitySamples,
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
