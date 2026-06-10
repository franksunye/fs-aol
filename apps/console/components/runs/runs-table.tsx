"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { agentDetailHref } from "@/lib/agents-nav";
import {
  formatCost,
  formatDuration,
  formatErrorRetry,
  type MockRun,
} from "@/lib/runs-mock";
import { runDetailHref } from "@/lib/runs-nav";
import { RunStatusBadge } from "./run-status-badge";

export function RunsTable({
  items,
  selectedId,
  hk,
}: {
  items: MockRun[];
  selectedId: string | null;
  hk?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm">
        当前筛选下暂无 Run 记录
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-border text-left text-[11px] font-medium">
              <th className="px-3 py-2.5">Agent</th>
              <th className="px-3 py-2.5">触发来源</th>
              <th className="px-3 py-2.5">开始时间</th>
              <th className="px-3 py-2.5">运行状态</th>
              <th className="px-3 py-2.5">耗时</th>
              <th className="px-3 py-2.5">模型成本</th>
              <th className="px-3 py-2.5">是否生成 Action</th>
              <th className="px-3 py-2.5">错误与重试</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const active = item.id === selectedId;
              const errorRetry = formatErrorRetry(item);
              const hasIssue = item.errorCount > 0 || item.retryCount > 0;

              return (
                <tr
                  key={item.id}
                  className={cn(
                    "border-b border-border transition-colors last:border-b-0",
                    active ? "bg-primary/5" : "hover:bg-muted/40"
                  )}
                >
                  <td className="px-3 py-2.5">
                    <Link
                      href={runDetailHref(item.id, hk)}
                      scroll={false}
                      className="group block min-w-0"
                    >
                      <span
                        className={cn(
                          "text-xs font-medium group-hover:text-primary",
                          active && "text-primary"
                        )}
                      >
                        {item.agentName}
                      </span>
                      <span className="text-muted-foreground mt-0.5 block font-mono text-[10px] tabular-nums">
                        {item.id}
                      </span>
                    </Link>
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 text-xs">
                    {item.triggerSource}
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 text-xs tabular-nums">
                    {item.startedAt}
                  </td>
                  <td className="px-3 py-2.5">
                    <RunStatusBadge status={item.status} />
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 text-xs tabular-nums">
                    {formatDuration(item.durationSec)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-xs tabular-nums">{formatCost(item.costYuan)}</div>
                    <div className="text-muted-foreground text-[10px]">
                      {item.model === "heuristic" ? "Heuristic" : "LLM"}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    {item.actionGenerated ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        已生成
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        未生成
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {hasIssue ? (
                      <div className="space-y-0.5">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            item.status === "anomaly"
                              ? "text-red-700"
                              : "text-amber-800"
                          )}
                        >
                          {errorRetry}
                        </span>
                        {item.errorSummary ? (
                          <span className="text-muted-foreground block text-[10px] leading-snug">
                            {item.errorSummary}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">{errorRetry}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="text-muted-foreground flex items-center justify-between border-t border-border px-3 py-2 text-xs">
        <span>
          演示数据 · 共 {items.length} 条
          {hk ? (
            <>
              {" "}
              ·{" "}
              <Link
                href={agentDetailHref("follow-up")}
                className="hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                Agent 配置
              </Link>
            </>
          ) : null}
        </span>
        <span>10 条/页（演示）</span>
      </div>
    </div>
  );
}
