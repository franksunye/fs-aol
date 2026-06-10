import { Suspense } from "react";
import { BarChart3 } from "lucide-react";
import { shellScrollClass } from "@/lib/shell-preferences";
import { cn } from "@/lib/utils";
import type { EvaluationPageSnapshot } from "@/lib/evaluation";
import { EvaluationFiltersBar } from "./evaluation-filters";
import { EvaluationKpiCards } from "./evaluation-kpi-cards";
import { EvaluationOpsMetrics } from "./evaluation-ops-metrics";
import { EvaluationCharts } from "./evaluation-charts";
import { EvaluationMiddleSections } from "./evaluation-middle-sections";
import { EvaluationQualitySamples } from "./evaluation-quality-samples";

export function EvaluationPage({
  data,
  hk,
}: {
  data: EvaluationPageSnapshot;
  hk?: string;
}) {
  const sourceHint = data.analyticsLoadFailed
    ? "库内统计暂不可用（如 Turso 超时），展示演示数据"
    : data.dataSource === "live"
      ? "部分指标来自库内真实统计"
      : data.dataSource === "mixed"
        ? "建议准确率/采纳率/转化增量等为库内统计，其余为演示数据"
        : "当前时段暂无库内记录，展示演示数据";

  return (
    <main className={cn(shellScrollClass, "h-full w-full px-6 py-8 lg:px-8")}>
      <header className="mb-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-xs font-bold">
                <BarChart3 className="size-4" aria-hidden />
              </span>
              <h1 className="text-xl font-semibold tracking-tight">评估分析</h1>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              Agent 效果评估：准确率、采纳与误报、成本延迟 ROI，非普通经营报表
            </p>
            <p className="text-muted-foreground mt-1 text-xs">{sourceHint}</p>
          </div>
        </div>
        <Suspense fallback={null}>
          <EvaluationFiltersBar filters={data.filters} hk={hk} />
        </Suspense>
      </header>

      <div className="space-y-6">
        <EvaluationKpiCards kpis={data.kpis} hk={hk} />
        <EvaluationOpsMetrics metrics={data.opsMetrics} hk={hk} />
        <EvaluationCharts
          suggestionTrend={data.suggestionTrend}
          actionStatusTrend={data.actionStatusTrend}
          hk={hk}
        />
        <EvaluationMiddleSections
          agents={data.agents}
          versions={data.versions}
          rules={data.rules}
          problemCases={data.problemCases}
          roles={data.roles}
          modules={data.modules}
          hk={hk}
        />
        <EvaluationQualitySamples samples={data.qualitySamples} hk={hk} />
      </div>
    </main>
  );
}
