"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, FileText, Link2, Plus } from "lucide-react";
import { INTEGRATIONS_HOME_PATH } from "@/lib/integrations-nav";
import { MOCK_INTEGRATIONS } from "@/lib/integrations-mock";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DataStateBadge, DataStateNote } from "@/components/data-state-badge";
import { IntegrationsSummaryCards } from "./integrations-summary-cards";
import { IntegrationListPanel } from "./integration-list-panel";
import { IntegrationDetailPanel } from "./integration-detail-panel";
import { IntegrationInsightPanel } from "./integration-insight-panel";

export function IntegrationsPage() {
  const sp = useSearchParams();
  const [selectedId, setSelectedId] = useState("crm-self");

  useEffect(() => {
    const fromQuery = sp.get("integration")?.trim();
    if (
      fromQuery &&
      MOCK_INTEGRATIONS.some((item) => item.id === fromQuery)
    ) {
      setSelectedId(fromQuery);
    }
  }, [sp]);

  const selectedIntegration = useMemo(
    () =>
      MOCK_INTEGRATIONS.find((item) => item.id === selectedId) ??
      MOCK_INTEGRATIONS[0],
    [selectedId]
  );

  return (
    <main
      className={cn(
        "shell-scroll min-h-0 h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-6 [scrollbar-gutter:stable] lg:px-8"
      )}
    >
      <div className="mx-auto w-full max-w-[1600px]">
        <header className="mb-6 space-y-4">
          <nav
            className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs"
            aria-label="面包屑"
          >
            <Link href={INTEGRATIONS_HOME_PATH} className="hover:text-foreground">
              集成
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <span className="text-foreground font-medium">系统集成</span>
          </nav>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                  <Link2 className="size-4" aria-hidden />
                </span>
                <h1 className="text-xl font-semibold tracking-tight">
                  系统集成
                </h1>
              </div>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                连接 CRM、FSM、沟通与企业协作系统，为 Agent
                提供业务上下文与执行能力。
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <DataStateBadge state="scenario" label="集成场景样例" />
                <DataStateBadge state="not_connected" label="写回未接入" />
              </div>
              <DataStateNote className="mt-2 max-w-2xl">
                当前页展示 AOL Business Harness 的目标形态；真实试点仍以 Follow-up 追踪库和 XLink 工单数据为主。
              </DataStateNote>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() =>
                  toast.message("新建连接暂未接入真实配置", {
                    description: "新建连接向导暂未接入真实配置",
                  })
                }
              >
                <Plus className="size-4" aria-hidden />
                新建连接
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  toast.message("集成日志暂未接入真实数据", {
                    description: "集成日志暂为场景样例",
                  })
                }
              >
                <FileText className="size-4" aria-hidden />
                查看日志
              </Button>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <IntegrationsSummaryCards />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)_minmax(0,15rem)] xl:items-start">
            <div className="xl:sticky xl:top-4 xl:max-h-[calc(100dvh-12rem)]">
              <IntegrationListPanel
                integrations={MOCK_INTEGRATIONS}
                selectedId={selectedIntegration.id}
                onSelect={setSelectedId}
              />
            </div>
            <IntegrationDetailPanel integration={selectedIntegration} />
            <IntegrationInsightPanel integration={selectedIntegration} />
          </div>
        </div>
      </div>
    </main>
  );
}
