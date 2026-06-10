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
import { DataStateBadge, DataStateNote } from "@/components/data-state-badge";

const DATA_SOURCE_HINT: Record<
  OverviewPageSnapshot["dataSource"],
  string
> = {
  live: "Follow-up 试点数据已接入；估算与场景样例单独标注",
  mixed: "Follow-up 待审核/流转为真实统计；多 Agent 与部分价值指标为场景样例或估算",
  mock: "当前展示 AOL 场景样例，库内统计暂不可用",
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
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DataStateBadge
              state={data.dataSource === "mock" ? "scenario" : "live"}
              label={data.dataSource === "mock" ? "场景样例" : "真实试点"}
            />
            {data.dataSource !== "live" ? (
              <DataStateBadge state="scenario" label="多 Agent 样例" />
            ) : null}
            <DataStateBadge state="estimated" label="价值估算" />
          </div>
          <DataStateNote className="mt-2 max-w-3xl">
            {DATA_SOURCE_HINT[data.dataSource]}
          </DataStateNote>
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
          <OverviewSectionTitle>真实试点运行</OverviewSectionTitle>
          <OverviewTodayPulseBar today={data.today} hk={hk} />
        </div>

        <div>
          <OverviewSectionTitle>Follow-up 执行链</OverviewSectionTitle>
          <OverviewKpiCards kpis={data.kpis} hk={hk} />
        </div>

        <div>
          <OverviewSectionTitle>效率与业务影响（估算）</OverviewSectionTitle>
          <OverviewRateMetrics rates={data.rates} hk={hk} />
        </div>

        <div>
          <OverviewSectionTitle>AOL 场景版图</OverviewSectionTitle>
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
          <OverviewSectionTitle>场景扩展 · 集成 · 今日需要处理</OverviewSectionTitle>
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
