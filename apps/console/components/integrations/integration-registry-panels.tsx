"use client";

import { FSM_INTEGRATION_ID } from "@/lib/integrations-nav";
import type { IntegrationRegistryItem } from "@/lib/adapters/integration-registry";
import { registryItemToMock } from "@/lib/adapters/integration-registry";
import type { FsmIntegrationView } from "@/lib/integration-bindings/types";
import type { RuntimeConfigPublic } from "@/lib/runtime-config/client";
import { IntegrationDetailPanel } from "./integration-detail-panel";
import { IntegrationInsightPanel } from "./integration-insight-panel";
import { FsmIntegrationWorkspace } from "./fsm-integration-workspace";
import { WecomLiveCard } from "./wecom-live-card";
import { TursoBootstrapCard } from "./turso-bootstrap-card";
import { SettingsSectionCard } from "@/components/agents/settings-section-card";
import { DataStateBadge } from "@/components/data-state-badge";

type FsmTab = "connection" | "ingestion" | "protocol" | "health";

export function IntegrationRegistryDetail({
  item,
  runtimeConfig,
  fsmView,
  fsmTab,
  tursoOk,
  onFsmTabChange,
}: {
  item: IntegrationRegistryItem;
  runtimeConfig: RuntimeConfigPublic | null;
  fsmView: FsmIntegrationView;
  fsmTab: FsmTab;
  tursoOk: boolean;
  onFsmTabChange?: (tab: FsmTab) => void;
}) {
  if (item.id === FSM_INTEGRATION_ID) {
    if (!runtimeConfig) {
      return (
        <p className="text-muted-foreground text-sm">
          未配置 AOL_CONFIG_ENCRYPTION_KEY，无法编辑 FSM 集成。
        </p>
      );
    }
    return (
      <FsmIntegrationWorkspace
        initial={runtimeConfig}
        view={fsmView}
        defaultTab={fsmTab}
        onTabChange={onFsmTabChange}
        embedded
      />
    );
  }

  if (item.id === "wecom" && runtimeConfig) {
    return <WecomLiveCard initial={runtimeConfig} />;
  }

  if (item.id === "turso") {
    return <TursoBootstrapCard tursoOk={tursoOk} />;
  }

  const mock = registryItemToMock(item);
  if (mock) {
    return <IntegrationDetailPanel integration={mock} />;
  }

  return (
    <p className="text-muted-foreground text-sm">暂无详情</p>
  );
}

export function IntegrationRegistryInsight({
  item,
  fsmView,
  tursoOk,
}: {
  item: IntegrationRegistryItem;
  fsmView: FsmIntegrationView;
  tursoOk: boolean;
}) {
  if (item.id === FSM_INTEGRATION_ID) {
    const health = fsmView.syncHealth;
    return (
      <aside className="space-y-4 xl:sticky xl:top-4">
        <SettingsSectionCard title="同步健康" bodyClassName="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">状态</span>
            <DataStateBadge
              state={health.status === "live" ? "live" : "not_connected"}
              label={
                health.status === "live"
                  ? "运行正常"
                  : health.status === "degraded"
                    ? "部分失败"
                    : "未配置"
              }
            />
          </div>
          {[
            ["处理", health.processed],
            ["成功", health.success],
            ["失败", health.failed],
            ["跳过", health.skipped],
          ].map(([label, val]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium tabular-nums">{val ?? "—"}</span>
            </div>
          ))}
        </SettingsSectionCard>
        <SettingsSectionCard title="同步设置" bodyClassName="space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">模式</span>
            <span>cron 批处理</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">上次运行</span>
            <span className="text-xs tabular-nums">
              {health.lastRunAt?.slice(0, 16).replace("T", " ") ?? "—"}
            </span>
          </div>
        </SettingsSectionCard>
      </aside>
    );
  }

  if (item.id === "wecom") {
    return (
      <aside className="space-y-4 xl:sticky xl:top-4">
        <SettingsSectionCard title="通知状态" bodyClassName="space-y-2 text-sm">
          <p className="text-muted-foreground text-xs">
            Webhook 在左侧详情配置；dry_run 在 Agent 设置中切换预览/正式发送。
          </p>
        </SettingsSectionCard>
      </aside>
    );
  }

  if (item.id === "turso") {
    return (
      <aside className="space-y-4 xl:sticky xl:top-4">
        <SettingsSectionCard title="数据库" bodyClassName="space-y-2">
          <DataStateBadge state={tursoOk ? "live" : "not_connected"} />
          <p className="text-muted-foreground text-xs">
            由 LIBSQL_URL 引导，追踪表与 runtime_config 均在此库。
          </p>
        </SettingsSectionCard>
      </aside>
    );
  }

  const mock = registryItemToMock(item);
  if (mock) {
    return <IntegrationInsightPanel integration={mock} />;
  }

  return null;
}

export function integrationRegistryBadgeState(
  dataState: IntegrationRegistryItem["dataState"]
): "live" | "scenario" | "not_connected" {
  if (dataState === "live" || dataState === "readonly") return "live";
  if (dataState === "scenario") return "scenario";
  return "not_connected";
}

export function integrationRegistryBadgeLabel(
  dataState: IntegrationRegistryItem["dataState"]
): string | undefined {
  if (dataState === "readonly") return "只读";
  if (dataState === "scenario") return "规划";
  return undefined;
}
