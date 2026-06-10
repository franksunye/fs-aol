"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  formatShortDateTime,
  type CalendarAction,
} from "@/lib/calendar-mock";
import { workbenchPaneHref } from "@/lib/workbench-nav";
import { CalendarPriorityBadge, CalendarStatusBadge } from "./calendar-badges";

export function CalendarRecentTable({
  actions,
  hk,
}: {
  actions: CalendarAction[];
  hk?: string;
}) {
  const listContext = { hk, from: "active" as const };

  return (
    <section className="mt-6" aria-label="近期行动">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">近期行动（未来 7 天）</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground gap-1"
          render={
            <Link
              href={hk ? `/?tab=actions&hk=${hk}` : "/?tab=actions"}
              scroll={false}
            />
          }
        >
          查看全部
          <ChevronRight className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>行动</TableHead>
              <TableHead>关联对象</TableHead>
              <TableHead>来源 Agent</TableHead>
              <TableHead>截止时间</TableHead>
              <TableHead>优先级</TableHead>
              <TableHead>负责人</TableHead>
              <TableHead>状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.map((item) => {
              const Icon = item.icon;
              const href = item.workOrderKey
                ? workbenchPaneHref(item.workOrderKey, listContext)
                : hk
                  ? `/?hk=${hk}`
                  : "/";
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={href}
                      scroll={false}
                      className="hover:text-primary flex items-center gap-2 font-medium transition-colors"
                    >
                      <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-md">
                        <Icon className="size-3.5" aria-hidden />
                      </span>
                      {item.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.relatedObject.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {item.relatedObject.type}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.sourceAgent}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatShortDateTime(item.date, item.startTime)}
                  </TableCell>
                  <TableCell>
                    <CalendarPriorityBadge priority={item.priority} />
                  </TableCell>
                  <TableCell>{item.assignee}</TableCell>
                  <TableCell>
                    <CalendarStatusBadge status={item.status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
