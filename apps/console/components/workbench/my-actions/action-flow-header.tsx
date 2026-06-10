"use client";

import { useRouter } from "next/navigation";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { MyActionsSummary } from "@/lib/my-actions-mock";
import { MyActionsSummaryCards } from "./my-actions-summary-cards";
import { ActionFlowSiteSelect } from "./action-flow-site-select";

export type ActionFlowDataSource = "actions" | "inbox" | "fallback";

const SOURCE_HINT: Record<ActionFlowDataSource, string> = {
  actions: "指标来自 Action 流转列表统计",
  inbox: "待分发等指标由待审核工单池估算，其余为演示数据",
  fallback: "当前暂无库内记录，展示演示指标",
};

export function ActionFlowHeader({
  summary,
  hk,
}: {
  summary: MyActionsSummary & { dataSource: ActionFlowDataSource };
  hk?: string;
}) {
  const router = useRouter();

  return (
    <div className="border-border/80 space-y-4 border-b px-3 pb-4 lg:px-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">Action 流转中心</h2>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            管理 Agent 生成的 Action 分发、执行状态与终端反馈
          </p>
          <p className="text-muted-foreground mt-0.5 text-[11px]">
            {SOURCE_HINT[summary.dataSource]}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="刷新 Action 流转数据"
            onClick={() => router.refresh()}
          >
            <RefreshCw className="size-4" aria-hidden />
          </Button>
          <ActionFlowSiteSelect hk={hk} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              toast.message("演示数据，暂未接入", {
                description: "导出将在后续版本开放。",
              })
            }
          >
            <Download className="size-3.5" aria-hidden />
            导出
          </Button>
        </div>
      </div>
      <MyActionsSummaryCards summary={summary} hk={hk} />
    </div>
  );
}
