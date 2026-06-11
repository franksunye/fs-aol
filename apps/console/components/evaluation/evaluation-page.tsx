import { Suspense } from "react";
import { BarChart3 } from "lucide-react";
import { shellScrollClass } from "@/lib/shell-preferences";
import { cn } from "@/lib/utils";
import type { EvaluationPageSnapshot } from "@/lib/evaluation";
import { DataStateBadge, DataStateNote } from "@/components/data-state-badge";
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
    ? "库内统计暂不可用（如 Turso 超时），展示场景样例"
    : data.dataSource === "live"
      ? "Follow-up 试点统计已接入，价值与 ROI 仍按估算口径展示"
      : data.dataSource === "mixed"
        ? "建议准确率/采纳率/转化增量等来自库内统计，其余为场景样例或估算"
        : "当前时段暂无库内记录，展示 AOL 场景样例";

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
            <div className="mt-2 flex flex-wrap gap-1.5">
              <DataStateBadge
                state={data.dataSource === "mock" ? "scenario" : "live"}
                label={data.dataSource === "mock" ? "场景样例" : "Follow-up 统计"}
              />
              <DataStateBadge state="estimated" label="ROI 估算" />
              <DataStateBadge state="scenario" label="多 Agent 对比样例" />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">{sourceHint}</p>
            <DataStateNote className="mt-2 max-w-3xl">
              评估页应成为 AOL 的度量层：先用真实 Follow-up 样本校准准确率、采纳和延迟，再用样例数据展示未来多 Agent 横向比较。
            </DataStateNote>
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
        <div className="relative space-y-4 rounded-xl border border-dashed border-violet-200 bg-violet-50/30 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">多 Agent 对比样例</span>
            <DataStateBadge state="scenario" />
          </div>
          <EvaluationMiddleSections
            agents={data.agents}
            versions={data.versions}
            rules={data.rules}
            problemCases={data.problemCases}
            roles={data.roles}
            modules={data.modules}
            hk={hk}
          />
        </div>
        <EvaluationQualitySamples samples={data.qualitySamples} hk={hk} />
      </div>
    </main>
  );
}
