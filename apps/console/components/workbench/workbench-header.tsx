"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HousekeeperFilter } from "@/components/housekeeper-filter";
import { LogoutButton } from "@/components/logout-button";
import type { PilotHousekeeper } from "@/lib/pilot-housekeepers";
import { isAuthEnabled } from "@/lib/auth";
import { cn } from "@/lib/utils";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "早上好";
  if (h < 18) return "下午好";
  return "晚上好";
}

export function WorkbenchHeader({
  displayName,
  pendingCount,
  pilots,
  hkFilter,
  compact = false,
}: {
  displayName: string;
  pendingCount: number;
  pilots: PilotHousekeeper[];
  hkFilter?: string;
  /** 分栏列表区：压缩标题与工具栏，避免与指标卡重复占高 */
  compact?: boolean;
}) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "flex items-center justify-between gap-3",
        compact ? "mb-3" : "mb-6 flex-wrap items-end gap-4"
      )}
    >
      <div className="min-w-0">
        <h1
          className={cn(
            "font-semibold tracking-tight",
            compact ? "truncate text-base" : "text-2xl"
          )}
        >
          {greeting()}，{displayName}
          {compact ? null : " 👋"}
        </h1>
        {!compact ? (
          <p className="text-muted-foreground mt-1 text-sm">
            {pendingCount > 0
              ? `今天有 ${pendingCount} 条机会待你处置`
              : "暂无待处置机会，可查看归档或等待 Agent 下一轮分析"}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="outline"
          size={compact ? "icon-sm" : "sm"}
          onClick={() => router.refresh()}
          className={compact ? undefined : "gap-1.5"}
          aria-label="刷新工作台数据"
        >
          <RefreshCw className="size-3.5" />
          {compact ? null : "刷新"}
        </Button>
        <HousekeeperFilter pilots={pilots} currentId={hkFilter} compact={compact} />
        {isAuthEnabled() ? <LogoutButton compact={compact} /> : null}
        {!compact ? (
          <Badge variant="outline" className="font-mono text-xs">
            v0.3.5
          </Badge>
        ) : null}
      </div>
    </header>
  );
}
