"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataStateBadge, DataStateNote } from "@/components/data-state-badge";
import { HousekeeperFilter } from "@/components/housekeeper-filter";
import { LogoutButton } from "@/components/logout-button";
import type { PilotHousekeeper } from "@/lib/pilot-housekeepers";
import { isAuthEnabled } from "@/lib/auth";
import { ACTION_CENTER_TITLE, ACTION_CENTER_SUBTITLE } from "@/lib/action-center-tabs";
import { cn } from "@/lib/utils";

export function ActionCenterHeader({
  pilots,
  hkFilter,
  compact = false,
  title = ACTION_CENTER_TITLE,
  subtitle = ACTION_CENTER_SUBTITLE,
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
        {!compact ? (
          <>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <DataStateBadge state="live" label="Follow-up 真实试点" />
              <DataStateBadge state="estimated" label="效果估算" />
            </div>
            <DataStateNote className="mt-2 max-w-3xl">
              Action 中心是当前真实楔子：建议、审核、Action 流转来自已接入的
              Follow-up 场景；终端写回和跨系统闭环仍需逐步接入。
            </DataStateNote>
          </>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="outline"
          size={compact ? "icon-sm" : "sm"}
          onClick={() => router.refresh()}
          className={compact ? undefined : "gap-1.5"}
          aria-label="刷新 Action 中心数据"
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
