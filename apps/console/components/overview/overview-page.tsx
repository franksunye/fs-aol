import { Suspense } from "react";
import { LayoutDashboard } from "lucide-react";
import { shellScrollClass } from "@/lib/shell-preferences";
import { cn } from "@/lib/utils";
import { getOverviewMockData } from "@/lib/overview-mock";
import { OverviewKpiCards } from "./overview-kpi-cards";
import { OverviewTrendChart } from "./overview-trend-chart";
import { OverviewActionStatusChart } from "./overview-action-status-chart";
import { OverviewTopAgents } from "./overview-top-agents";
import { OverviewIntegrationHealthPanel } from "./overview-integration-health";
import { OverviewAttentionList } from "./overview-attention-list";
import { OverviewSiteSelect } from "./overview-site-select";
import { OverviewRefreshButton } from "./overview-refresh-button";

export function OverviewPage({ hk }: { hk?: string }) {
  const data = getOverviewMockData(hk);

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
            监控 Agent 运行状态、Action 流转与业务闭环表现
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
        <OverviewKpiCards kpis={data.kpis} hk={hk} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <OverviewTrendChart points={data.trend} hk={hk} />
          <OverviewActionStatusChart
            slices={data.actionStatus.slices}
            total={data.actionStatus.total}
            hk={hk}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <OverviewTopAgents agents={data.topAgents} />
          <OverviewIntegrationHealthPanel items={data.integrationHealth} />
          <OverviewAttentionList items={data.attentionItems} hk={hk} />
        </div>
      </div>
    </main>
  );
}
