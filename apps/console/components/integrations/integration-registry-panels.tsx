"use client";

import { Database, FileCode2, HeartPulse, Settings2, ShieldAlert } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

type FsmTab = "connection" | "ingestion" | "protocol" | "health";

const FSM_SETTINGS_PLACEHOLDERS = [
  ["连接", "凭据、数据库与来源标识", Database],
  ["摄取策略", "捞取范围、批量与试点名单", Settings2],
  ["集成协议", "对象映射与工作台显示契约", FileCode2],
  ["同步健康", "cron 快照、成功率与诊断", HeartPulse],
] as const;

function FsmRuntimeSetupRequired({ view }: { view: FsmIntegrationView }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-sky-500/10 text-sky-700 flex size-10 items-center justify-center rounded-lg text-sm font-bold">
              FSM
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">
                  {view.binding.display_name}
                </h2>
                <DataStateBadge state="live" />
                <Badge variant="outline" className="border-amber-200 text-amber-800">
                  待初始化
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                binding {view.binding.id}@{view.binding.version}
              </p>
            </div>
          </div>
          <p className="text-muted-foreground mt-3 max-w-3xl text-sm">
            {view.humanSummary}
          </p>
        </div>
      </div>

      <div className="grid min-h-[28rem] lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="border-b bg-muted/20 p-3 lg:border-r lg:border-b-0">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="集成设置">
            {FSM_SETTINGS_PLACEHOLDERS.map(([label, description, Icon], index) => (
              <div
                key={label}
                className={[
                  "flex min-w-[11.5rem] items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm lg:min-w-0",
                  index === 0
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="min-w-0">
                  <span className="block font-medium">{label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                    {description}
                  </span>
                </span>
              </div>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <div className="border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-amber-700" aria-hidden />
              <h3 className="text-base font-semibold">运行时配置未初始化</h3>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              配置密钥缺失时，Console 只能展示集成摘要，不能编辑连接凭据或摄取策略。
            </p>
          </div>
          <div className="px-5 py-5">
            <div className="rounded-lg border border-dashed bg-muted/20 p-5">
              <p className="text-sm font-medium">需要配置 AOL_CONFIG_ENCRYPTION_KEY</p>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                请在本地或部署环境设置与 cron 相同的加密密钥后刷新页面。完成后这里会显示连接、摄取策略、集成协议和同步健康的完整设置界面。
              </p>
              <code className="mt-4 block rounded-md border bg-background px-3 py-2 text-xs">
                AOL_CONFIG_ENCRYPTION_KEY=...
              </code>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

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
      return <FsmRuntimeSetupRequired view={fsmView} />;
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
