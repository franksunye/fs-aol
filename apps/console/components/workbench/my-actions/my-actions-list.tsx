"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

function PriorityCell({ label }: { label: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[2rem] justify-center rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums",
        label === "高" && "bg-red-50 text-red-600",
        label === "中" && "bg-amber-50 text-amber-700",
        label === "低" && "bg-emerald-50 text-emerald-700",
        label !== "高" && label !== "中" && label !== "低" && "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  );
}

function myActionSourceAgent(item: MyAction): ActionEntityRef {
  return { id: item.agentId, label: item.sourceAgent };
}

function myActionSourceSystem(item: MyAction): ActionEntityRef {
  return item.sourceSystem ?? XLINK_SOURCE_SYSTEM;
}

export function MyActionsList({
  items,
  selectedId,
  hk,
}: {
  items: MyAction[];
  selectedId: string | null;
  hk?: string;
}) {
  const router = useRouter();

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
      aria-label="待执行 Action 列表"
    >
      <table className="w-full min-w-[920px] border-collapse text-sm">
        <thead>
          <tr className="bg-muted/40 border-b border-border text-left">
            <th className="text-muted-foreground w-10 px-2 py-2 text-[11px] font-semibold tracking-wide uppercase">
              级
            </th>
            <th className="text-muted-foreground px-2 py-2 text-[11px] font-semibold tracking-wide uppercase">
              Action 标题
            </th>
            <th className="text-muted-foreground hidden px-2 py-2 text-[11px] font-semibold tracking-wide uppercase sm:table-cell">
              来源 Agent
            </th>
            <th className="text-muted-foreground px-2 py-2 text-[11px] font-semibold tracking-wide uppercase">
              关联对象
            </th>
            <th className="text-muted-foreground hidden px-2 py-2 text-[11px] font-semibold tracking-wide uppercase md:table-cell">
              来源系统
            </th>
            <th className="text-muted-foreground hidden px-2 py-2 text-[11px] font-semibold tracking-wide uppercase lg:table-cell">
              执行人
            </th>
            <th className="text-muted-foreground px-2 py-2 text-[11px] font-semibold tracking-wide uppercase">
              状态
            </th>
            <th className="text-muted-foreground px-2 py-2 text-right text-[11px] font-semibold tracking-wide uppercase">
              时间
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.id === selectedId;
            const href = myActionHref(item.id, hk);
            const sourceAgent = myActionSourceAgent(item);
            const sourceSystem = myActionSourceSystem(item);

            return (
              <tr
                key={item.id}
                role="option"
                aria-selected={active}
                className={cn(
                  "border-b border-border/60 transition-colors last:border-0",
                  active
                    ? "bg-primary/5"
                    : "hover:bg-muted/35"
                )}
              >
                <td className="px-2 py-2.5 align-middle">
                  <PriorityCell label={calendarPriorityLabel(item.priority)} />
                </td>
                <td className="max-w-[14rem] px-2 py-2.5 align-middle">
                  <Link
                    href={href}
                    scroll={false}
                    className={cn(
                      "flex min-w-0 items-start gap-2 hover:underline",
                      active ? "text-primary" : "text-foreground"
                    )}
                    onFocus={() => router.prefetch(href)}
                  >
                    <span className="bg-primary/10 text-primary mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <span className="line-clamp-2 min-w-0 text-sm font-medium leading-snug">
                      {item.title}
                    </span>
                  </Link>
                  <p className="text-muted-foreground mt-1 truncate text-[11px] sm:hidden">
                    {sourceAgent.label}
                  </p>
                </td>
                <td className="text-muted-foreground hidden max-w-[7rem] truncate px-2 py-2.5 align-middle text-xs sm:table-cell">
                  {sourceAgent.label}
                </td>
                <td className="px-2 py-2.5 align-middle">
                  <p className="font-mono text-xs font-medium tabular-nums">
                    {item.opportunityId}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    {WORK_ORDER_OBJECT_TYPE}
                  </p>
                </td>
                <td className="text-muted-foreground hidden px-2 py-2.5 align-middle text-xs md:table-cell">
                  {sourceSystem.label}
                </td>
                <td
                  className="hidden max-w-[5rem] truncate px-2 py-2.5 align-middle text-xs lg:table-cell"
                  title={item.assignee}
                >
                  {item.assignee}
                </td>
                <td className="px-2 py-2.5 align-middle">
                  <ActionFlowStatusBadge status={item.status} />
                </td>
                <td className="text-muted-foreground px-2 py-2.5 text-right align-middle text-xs tabular-nums">
                  {formatDueLabel(item.dueDate, item.dueTime)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
