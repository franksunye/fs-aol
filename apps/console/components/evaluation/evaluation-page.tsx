import { Suspense } from "react";
import { BarChart3 } from "lucide-react";
import { shellScrollClass } from "@/lib/shell-preferences";
import { cn } from "@/lib/utils";
import type { EvaluationPageSnapshot } from "@/lib/evaluation";
import { EvaluationFiltersBar } from "./evaluation-filters";
import { EvaluationKpiCards } from "./evaluation-kpi-cards";
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
  const sourceHint =
    data.dataSource === "live"
      ? "部分指标来自库内真实统计"
      : data.dataSource === "mixed"
        ? "建议数/采纳率/业务价值等为库内统计，其余为演示数据"
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
              评估 Agent 与 Actions 的效果、质量与业务影响
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
        <EvaluationCharts
          suggestionTrend={data.suggestionTrend}
          actionStatusTrend={data.actionStatusTrend}
          hk={hk}
        />
        <EvaluationMiddleSections
          agents={data.agents}
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
