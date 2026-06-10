import { Suspense } from "react";
import { LayoutDashboard } from "lucide-react";
import { shellScrollClass } from "@/lib/shell-preferences";
import { cn } from "@/lib/utils";
import type { OverviewPageSnapshot } from "@/lib/overview";
import { OverviewKpiCards } from "./overview-kpi-cards";
import { OverviewTodayPulseBar } from "./overview-today-pulse";
import { OverviewRateMetrics } from "./overview-rate-metrics";
import { OverviewAgentFleet } from "./overview-agent-fleet";
import { OverviewSectionTitle } from "./overview-section-title";
import { OverviewTrendChart } from "./overview-trend-chart";
import { OverviewActionStatusChart } from "./overview-action-status-chart";
import { OverviewTopAgents } from "./overview-top-agents";
import { OverviewIntegrationHealthPanel } from "./overview-integration-health";
import { OverviewAttentionList } from "./overview-attention-list";
import { OverviewSiteSelect } from "./overview-site-select";
import { OverviewRefreshButton } from "./overview-refresh-button";

const DATA_SOURCE_HINT: Record<
  OverviewPageSnapshot["dataSource"],
  string
> = {
  live: "核心数量与效率指标均来自库内统计",
  mixed: "待审核/流转数量为库内统计；今日产出、效率与 Agent 状态为演示参考",
  mock: "当前展示演示数据，库内统计暂不可用",
};

export function OverviewPage({
  data,
  hk,
}: {
  data: OverviewPageSnapshot;
  hk?: string;
}) {
  return (
    <main className={cn(shellScrollClass, "h-full w-full px-6 py-8 lg:px-8")}>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-xs font-bold">
              <LayoutDashboard className="size-4" aria-hidden />
            </span>
            <h1 className="text-xl font-semibold tracking-tight">运营总览</h1>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            AOL 运营驾驶舱 · 一眼掌握 Agent 运行、Action 流转与业务影响
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {DATA_SOURCE_HINT[data.dataSource]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OverviewRefreshButton />
          <Suspense fallback={null}>
            <OverviewSiteSelect hk={hk} />
          </Suspense>
        </div>
      </header>

      <div className="space-y-6">
        <div>
          <OverviewSectionTitle>今日产出</OverviewSectionTitle>
          <OverviewTodayPulseBar today={data.today} hk={hk} />
        </div>

        <div>
          <OverviewSectionTitle>核心运营指标</OverviewSectionTitle>
          <OverviewKpiCards kpis={data.kpis} hk={hk} />
        </div>

        <div>
          <OverviewSectionTitle>效率与业务影响</OverviewSectionTitle>
          <OverviewRateMetrics rates={data.rates} hk={hk} />
        </div>

        <div>
          <OverviewSectionTitle>Agent 运行状态</OverviewSectionTitle>
          <OverviewAgentFleet agents={data.agentFleet} />
        </div>

        <div>
          <OverviewSectionTitle>趋势与分布</OverviewSectionTitle>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <OverviewTrendChart points={data.trend} hk={hk} />
            <OverviewActionStatusChart
              slices={data.actionStatus.slices}
              total={data.actionStatus.total}
              hk={hk}
            />
          </div>
        </div>

        <div>
          <OverviewSectionTitle>绩效 · 集成 · 异常</OverviewSectionTitle>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <OverviewTopAgents agents={data.topAgents} />
            <OverviewIntegrationHealthPanel items={data.integrationHealth} />
            <OverviewAttentionList items={data.attentionItems} hk={hk} />
          </div>
        </div>
      </div>
    </main>
  );
}
