"use client";

import { Card } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";
import type { RuntimeConfigPublic } from "@/lib/runtime-config/client";

export function RuntimeSyncStatusCard({
  runtime,
  snapshotRunAt,
  snapshotProvider,
  snapshotDryRun,
  isBootstrap = false,
}: {
  runtime: RuntimeConfigPublic | null;
  snapshotRunAt: string | null;
  snapshotProvider?: string;
  snapshotDryRun?: boolean;
  isBootstrap?: boolean;
}) {
  if (!runtime) {
    return (
      <Card className="border-border gap-2 p-4">
        <DataStateBadge state="not_connected" label="运行时配置未初始化" />
        <p className="text-muted-foreground text-xs">
          请在 Vercel / 本地配置 <code className="text-[11px]">AOL_CONFIG_ENCRYPTION_KEY</code>
          （与 GHA cron 相同），然后刷新本页；或在下方 live 表单保存以创建首版配置。
        </p>
      </Card>
    );
  }

  if (isBootstrap) {
    return (
      <Card className="border-border gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">配置同步状态</span>
          <DataStateBadge state="estimated" label="待首次保存" />
        </div>
        <p className="text-muted-foreground text-xs">
          Turso 尚无 runtime_config 记录。在下方填写并保存后创建 v1（无需先跑 migrate 脚本）。
          {snapshotRunAt
            ? ` · 当前 cron 仍用 env/GHA 配置 · 上次运行 ${snapshotRunAt.slice(0, 16).replace("T", " ")}`
            : ""}
        </p>
      </Card>
    );
  }

  const synced =
    snapshotProvider != null &&
    snapshotProvider === runtime.config.llm_provider &&
    (snapshotDryRun === undefined || snapshotDryRun === runtime.config.dry_run);

  return (
    <Card className="border-border gap-2 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">配置同步状态</span>
        <DataStateBadge state="live" />
        <DataStateBadge
          state={synced ? "live" : "estimated"}
          label={synced ? "已与 cron 对齐" : "已保存 · 待 cron"}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        已保存 v{runtime.version} · {runtime.updatedAt}
        {snapshotRunAt ? ` · 上次 cron ${snapshotRunAt}` : " · 尚无 cron 快照"}
      </p>
    </Card>
  );
}
