"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, FileText, Link2, Plus } from "lucide-react";
import {
  FSM_INTEGRATION_ID,
  INTEGRATIONS_HOME_PATH,
} from "@/lib/integrations-nav";
import type { FsmIntegrationView } from "@/lib/integration-bindings/types";
import { MOCK_INTEGRATIONS } from "@/lib/integrations-mock";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DataStateBadge, DataStateNote } from "@/components/data-state-badge";
import { IntegrationsSummaryCards } from "./integrations-summary-cards";
import { IntegrationListPanel } from "./integration-list-panel";
import { IntegrationDetailPanel } from "./integration-detail-panel";
import { IntegrationInsightPanel } from "./integration-insight-panel";
import { FsmIntegrationWorkspace } from "./fsm-integration-workspace";
import { WecomLiveCard } from "./wecom-live-card";
import { TursoBootstrapCard } from "./turso-bootstrap-card";
import type { RuntimeConfigPublic } from "@/lib/runtime-config/store";
import { RuntimeSyncStatusCard } from "@/components/runtime/runtime-sync-status-card";

type FsmTab = "connection" | "ingestion" | "protocol" | "health";

export function IntegrationsPage({
  runtimeConfig = null,
  runtimeBootstrap = false,
  fsmView,
  tursoOk = false,
  snapshotRunAt = null,
}: {
  runtimeConfig?: RuntimeConfigPublic | null;
  runtimeBootstrap?: boolean;
  fsmView: FsmIntegrationView;
  tursoOk?: boolean;
  snapshotRunAt?: string | null;
}) {
  const sp = useSearchParams();
  const [selectedId, setSelectedId] = useState("crm-self");

  const fsmTab = useMemo((): FsmTab => {
    const t = sp.get("tab")?.trim();
    if (t === "ingestion" || t === "protocol" || t === "health") return t;
    return "connection";
  }, [sp]);

  useEffect(() => {
    const fromQuery = sp.get("integration")?.trim();
    if (fromQuery === FSM_INTEGRATION_ID) return;
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
                {runtimeConfig ? (
                  <DataStateBadge state="live" label="Follow-up 已接入" />
                ) : null}
                <DataStateBadge state="scenario" label="目标态样例" />
              </div>
              <DataStateNote className="mt-2 max-w-2xl">
                XLink FSM 集成协议与摄取策略可在下方工作台配置；折叠区为目标态场景样例。
              </DataStateNote>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() =>
                  toast.message("新建连接暂未接入真实配置", {
                    description: "多 connector 注册表规划在 v0.5+",
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
          <section aria-label="已接入集成">
            <h2 className="mb-3 text-sm font-semibold">已接入（live）</h2>
            <div className="space-y-4">
              <RuntimeSyncStatusCard
                runtime={runtimeConfig}
                isBootstrap={runtimeBootstrap}
                snapshotRunAt={snapshotRunAt}
              />
              {runtimeConfig ? (
                <>
                  <FsmIntegrationWorkspace
                    initial={runtimeConfig}
                    view={fsmView}
                    defaultTab={fsmTab}
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <WecomLiveCard initial={runtimeConfig} />
                    <TursoBootstrapCard tursoOk={tursoOk} />
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  未配置 AOL_CONFIG_ENCRYPTION_KEY，无法编辑 FSM / 企微集成。请在
                  Vercel 设置与 GHA 相同的密钥后刷新。
                </p>
              )}
            </div>
          </section>

          <details className="rounded-xl border border-dashed border-violet-200 bg-violet-50/20 p-4">
            <summary className="cursor-pointer text-sm font-medium">
              AOL 目标态集成样例（{MOCK_INTEGRATIONS.length} 个连接器 · scenario）
            </summary>
            <div className="mt-4 space-y-6">
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
          </details>
        </div>
      </div>
    </main>
  );
}
