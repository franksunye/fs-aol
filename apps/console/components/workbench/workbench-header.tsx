"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HousekeeperFilter } from "@/components/housekeeper-filter";
import { LogoutButton } from "@/components/logout-button";
import type { PilotHousekeeper } from "@/lib/pilot-housekeepers";
import { isAuthEnabled } from "@/lib/auth";

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
}: {
  displayName: string;
  pendingCount: number;
  pilots: PilotHousekeeper[];
  hkFilter?: string;
}) {
  const router = useRouter();

  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}，{displayName} 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {pendingCount > 0
            ? `今天有 ${pendingCount} 条机会待你处置`
            : "暂无待处置机会，可查看归档或等待 Agent 下一轮分析"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.refresh()}
          className="gap-1.5"
          aria-label="刷新工作台数据"
        >
          <RefreshCw className="size-3.5" />
          刷新
        </Button>
        <HousekeeperFilter pilots={pilots} currentId={hkFilter} />
        {isAuthEnabled() ? <LogoutButton /> : null}
        <Badge variant="outline" className="font-mono text-xs">
          v0.3.5
        </Badge>
      </div>
    </header>
  );
}
