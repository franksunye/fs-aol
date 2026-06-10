"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  formatDueLabel,
  myActionHref,
  type MyAction,
} from "@/lib/my-actions-mock";
import { ActionFlowStatusBadge } from "./action-flow-badges";

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
      className="overflow-hidden rounded-xl border border-border bg-card"
      role="listbox"
      aria-label="Action 流转列表"
    >
      <div className="text-muted-foreground hidden border-b border-border px-3 py-2 text-[11px] font-medium lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_4rem_5rem_4.5rem] lg:gap-2">
        <span>Action</span>
        <span>关联对象</span>
        <span>执行人</span>
        <span>截止时间</span>
        <span>状态</span>
      </div>
      <ul>
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === selectedId;
          return (
            <li key={item.id}>
              <Link
                href={myActionHref(item.id, hk)}
                scroll={false}
                role="option"
                aria-selected={active}
                className={cn(
                  "grid gap-2 border-b border-border px-3 py-3 transition-colors last:border-b-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_4rem_5rem_4.5rem] lg:items-center",
                  active
                    ? "bg-primary/5 ring-1 ring-inset ring-primary/20"
                    : "hover:bg-muted/40"
                )}
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">
                      {item.title}
                    </p>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {item.sourceAgent}
                    </p>
                  </div>
                </div>
                <div className="min-w-0 pl-10 lg:pl-0">
                  <p className="truncate text-xs font-medium">{item.target.name}</p>
                  <p className="text-muted-foreground truncate text-[11px]">
                    {item.target.type}
                  </p>
                </div>
                <span className="text-muted-foreground pl-10 text-xs lg:pl-0">
                  {item.assignee}
                </span>
                <span className="text-muted-foreground pl-10 text-xs tabular-nums lg:pl-0">
                  {formatDueLabel(item.dueDate, item.dueTime)}
                </span>
                <span className="pl-10 lg:pl-0">
                  <ActionFlowStatusBadge status={item.status} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
