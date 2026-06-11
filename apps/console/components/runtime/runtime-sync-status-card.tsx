"use client";

import { Card } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";
import type { RuntimeConfigPublic } from "@/lib/runtime-config/client";

export function RuntimeSyncStatusCard({
  runtime,
  snapshotRunAt,
  snapshotProvider,
  snapshotDryRun,
}: {
  runtime: RuntimeConfigPublic | null;
  snapshotRunAt: string | null;
  snapshotProvider?: string;
  snapshotDryRun?: boolean;
}) {
  if (!runtime) {
    return (
      <Card className="border-border gap-2 p-4">
        <DataStateBadge state="not_connected" label="运行时配置未初始化" />
        <p className="text-muted-foreground text-xs">
          请执行 migrate-env-to-runtime-config 导入首版配置。
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
