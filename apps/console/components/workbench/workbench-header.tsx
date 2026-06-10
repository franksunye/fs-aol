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

export function WorkbenchHeader({
  pilots,
  hkFilter,
  compact = false,
  title = "工作台",
  subtitle = "统一查看 Agent 生成的建议、Action 分发状态与业务反馈。",
}: {
  pilots: PilotHousekeeper[];
  hkFilter?: string;
  /** 分栏列表区：压缩标题与工具栏，避免与指标卡重复占高 */
  compact?: boolean;
  title?: string;
  subtitle?: string;
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
            compact ? "text-base" : "text-2xl"
          )}
        >
          {title}
        </h1>
        <p
          className={cn(
            "text-muted-foreground mt-1 leading-relaxed",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {subtitle}
        </p>
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
