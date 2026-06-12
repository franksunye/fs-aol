"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, FileText, Link2, Plus } from "lucide-react";
import {
  FSM_INTEGRATION_ID,
  INTEGRATIONS_HOME_PATH,
} from "@/lib/integrations-nav";
import { buildIntegrationRegistry } from "@/lib/adapters/integration-registry";
import type { FsmIntegrationView } from "@/lib/integration-bindings/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DataStateBadge } from "@/components/data-state-badge";
import { IntegrationsSummaryCards } from "./integrations-summary-cards";
import { IntegrationListPanel } from "./integration-list-panel";
import { IntegrationRegistryDetail } from "./integration-registry-panels";
import { RuntimeSyncStatusCard } from "@/components/runtime/runtime-sync-status-card";
import type { RuntimeConfigPublic } from "@/lib/runtime-config/store";

type FsmTab = "connection" | "ingestion" | "protocol" | "health";

const DEFAULT_SELECTION = FSM_INTEGRATION_ID;

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
  const router = useRouter();

  const registry = useMemo(
    () =>
      buildIntegrationRegistry({
        runtimeConfig,
        fsmView,
        snapshotRunAt,
        tursoOk,
      }),
    [runtimeConfig, fsmView, snapshotRunAt, tursoOk]
  );

  const fsmTab = useMemo((): FsmTab => {
    const t = sp.get("tab")?.trim();
    if (t === "ingestion" || t === "protocol" || t === "health") return t;
    return "connection";
  }, [sp]);

  const initialSelection = useMemo(() => {
    const fromQuery = sp.get("integration")?.trim();
    if (fromQuery && registry.some((r) => r.id === fromQuery)) {
      return fromQuery;
    }
    return DEFAULT_SELECTION;
  }, [sp, registry]);

  const selectedId = initialSelection;

  const selectedItem = useMemo(
    () =>
      registry.find((item) => item.id === selectedId) ?? registry[0],
    [registry, selectedId]
  );

  const syncUrl = useCallback(
    (integrationId: string, tab?: FsmTab) => {
      const params = new URLSearchParams();
      params.set("integration", integrationId);
      if (integrationId === FSM_INTEGRATION_ID && tab) {
        params.set("tab", tab);
      }
      router.replace(`${INTEGRATIONS_HOME_PATH}?${params.toString()}`, {
        scroll: false,
      });
    },
    [router]
  );

  function handleSelect(id: string) {
    syncUrl(id, id === FSM_INTEGRATION_ID ? fsmTab : undefined);
  }

  function handleFsmTabChange(tab: FsmTab) {
    if (selectedId === FSM_INTEGRATION_ID) {
      syncUrl(FSM_INTEGRATION_ID, tab);
    }
  }

  const liveCount = registry.filter(
    (r) => r.dataState === "live" || r.dataState === "readonly"
  ).length;
  const scenarioCount = registry.filter((r) => r.dataState === "scenario").length;

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
                <DataStateBadge state="live" label={`${liveCount} 已接入`} />
                {scenarioCount > 0 ? (
                  <DataStateBadge
                    state="scenario"
                    label={`${scenarioCount} 规划`}
                  />
                ) : null}
              </div>
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
          <RuntimeSyncStatusCard
            runtime={runtimeConfig}
            isBootstrap={runtimeBootstrap}
            snapshotRunAt={snapshotRunAt}
          />

          <IntegrationsSummaryCards
            connectedSystems={liveCount}
            healthySync={
              fsmView.syncHealth.status === "live"
                ? liveCount
                : Math.max(0, liveCount - 1)
            }
            pendingConfig={registry.filter((r) => r.status === "pending").length}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] xl:items-start">
            <div className="xl:sticky xl:top-4 xl:max-h-[calc(100dvh-12rem)]">
              <IntegrationListPanel
                registryItems={registry}
                selectedId={selectedItem?.id ?? DEFAULT_SELECTION}
                onSelect={handleSelect}
              />
            </div>
            <div className="min-w-0">
              {selectedItem ? (
                <IntegrationRegistryDetail
                  item={selectedItem}
                  runtimeConfig={runtimeConfig}
                  fsmView={fsmView}
                  fsmTab={fsmTab}
                  tursoOk={tursoOk}
                  onFsmTabChange={handleFsmTabChange}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
