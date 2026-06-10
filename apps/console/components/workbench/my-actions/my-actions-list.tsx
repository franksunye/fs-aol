"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  calendarPriorityLabel,
  WORK_ORDER_OBJECT_TYPE,
  XLINK_SOURCE_SYSTEM,
  type ActionEntityRef,
} from "@/lib/action-list-display";
import {
  formatDueLabel,
  myActionHref,
  type MyAction,
} from "@/lib/my-actions-mock";
import { ActionFlowStatusBadge } from "./action-flow-badges";

function myActionSourceAgent(item: MyAction): ActionEntityRef {
  return { id: item.agentId, label: item.sourceAgent };
}

function myActionSourceSystem(item: MyAction): ActionEntityRef {
  return item.sourceSystem ?? XLINK_SOURCE_SYSTEM;
}

const ROW_GRID =
  "lg:grid lg:grid-cols-[2.5rem_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,0.75fr)_4.5rem_minmax(0,3.5rem)_4.5rem_4rem] lg:items-center lg:gap-2";

export function MyActionsList({
  items,
  selectedId,
  hk,
}: {
  items: MyAction[];
  selectedId: string | null;
  hk?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm">
        当前筛选下暂无 Action
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border border-border bg-card"
      role="listbox"
      aria-label="Action 流转列表"
    >
      <div
        className={cn(
          "text-muted-foreground hidden border-b border-border px-3 py-2 text-[11px] font-medium",
          ROW_GRID
        )}
      >
        <span>级</span>
        <span>Action 标题</span>
        <span>来源 Agent</span>
        <span>关联对象</span>
        <span>来源系统</span>
        <span>执行人</span>
        <span>状态</span>
        <span className="text-right">时间</span>
      </div>
      <ul>
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === selectedId;
          const sourceAgent = myActionSourceAgent(item);
          const sourceSystem = myActionSourceSystem(item);

          return (
            <li key={item.id}>
              <Link
                href={myActionHref(item.id, hk)}
                scroll={false}
                role="option"
                aria-selected={active}
                className={cn(
                  "grid gap-2 border-b border-border px-3 py-3 transition-colors last:border-b-0",
                  ROW_GRID,
                  active
                    ? "bg-primary/5 ring-1 ring-inset ring-primary/20"
                    : "hover:bg-muted/40"
                )}
              >
                <span className="pl-10 lg:pl-0">
                  <span
                    className={cn(
                      "inline-flex min-w-[2rem] justify-center rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums",
                      item.priority === "high" && "bg-red-50 text-red-600",
                      item.priority === "medium" && "bg-amber-50 text-amber-700",
                      item.priority === "low" && "bg-emerald-50 text-emerald-700"
                    )}
                  >
                    {calendarPriorityLabel(item.priority)}
                  </span>
                </span>
                <div className="flex min-w-0 items-start gap-2.5 pl-10 lg:pl-0">
                  <span className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <p className="line-clamp-2 min-w-0 text-sm font-medium leading-snug">
                    {item.title}
                  </p>
                </div>
                <span className="text-muted-foreground truncate pl-10 text-xs lg:pl-0">
                  {sourceAgent.label}
                </span>
                <div className="min-w-0 pl-10 lg:pl-0">
                  <p className="truncate font-mono text-xs font-medium tabular-nums">
                    {item.opportunityId}
                  </p>
                  <p className="text-muted-foreground truncate text-[11px]">
                    {WORK_ORDER_OBJECT_TYPE}
                  </p>
                </div>
                <span className="text-muted-foreground truncate pl-10 text-xs lg:pl-0">
                  {sourceSystem.label}
                </span>
                <span className="text-muted-foreground truncate pl-10 text-xs lg:pl-0">
                  {item.assignee}
                </span>
                <span className="pl-10 lg:pl-0">
                  <ActionFlowStatusBadge status={item.status} />
                </span>
                <span className="text-muted-foreground pl-10 text-right text-xs tabular-nums lg:pl-0">
                  {formatDueLabel(item.dueDate, item.dueTime)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
