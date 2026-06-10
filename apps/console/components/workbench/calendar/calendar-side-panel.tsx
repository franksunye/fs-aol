"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  actionsForDate,
  calendarMonthCells,
  dueSoonActions,
  formatDateKey,
  formatTimeRange,
  isSameDay,
  overdueActions,
  overdueDays,
  type CalendarAction,
} from "@/lib/calendar-mock";
import { myActionHref } from "@/lib/my-actions-mock";
import { workbenchPaneHref } from "@/lib/workbench-nav";
import { CalendarStatusBadge } from "./calendar-badges";

function MiniCalendar({
  month,
  selectedDate,
  today,
  onSelectDate,
}: {
  month: Date;
  selectedDate: Date;
  today: Date;
  onSelectDate: (date: Date) => void;
}) {
  const cells = calendarMonthCells(month).filter((_, i, arr) => {
    const weekIndex = Math.floor(i / 7);
    const totalWeeks = Math.ceil(arr.length / 7);
    return weekIndex < Math.min(totalWeeks, 5);
  });

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="mb-2 text-center text-xs font-semibold">
        {month.getFullYear()}年{month.getMonth() + 1}月
      </p>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px]">
        {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
          <span key={d} className="text-muted-foreground py-0.5">
            {d}
          </span>
        ))}
        {cells.map((date) => {
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const inMonth = date.getMonth() === month.getMonth();
          return (
            <button
              key={formatDateKey(date)}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                "rounded-md py-1 tabular-nums transition-colors",
                inMonth ? "text-foreground" : "text-muted-foreground/60",
                isSelected && "bg-primary/10 text-primary font-semibold",
                isToday && !isSelected && "font-semibold text-primary"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleItem({
  item,
  hk,
}: {
  item: CalendarAction;
  hk?: string;
}) {
  const listContext = { hk, from: "active" as const };
  const href = item.myActionId
    ? myActionHref(item.myActionId, hk)
    : item.workOrderKey
      ? workbenchPaneHref(item.workOrderKey, listContext)
      : hk
        ? `/?tab=actions&hk=${hk}`
        : "/?tab=actions";
  const isActive = item.status === "in_progress";

  return (
    <li className="border-b border-border py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[11px] tabular-nums">
            {formatTimeRange(item.startTime, item.endTime)}
          </p>
          <p className="mt-0.5 text-sm font-medium">{item.title}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {item.relatedObject.name} · {item.sourceAgent}
          </p>
        </div>
        <CalendarStatusBadge status={item.status} />
      </div>
      <div className="mt-2">
        <Button
          type="button"
          size="sm"
          variant={isActive ? "default" : "outline"}
          className="h-7 text-xs"
          render={<Link href={href} scroll={false} />}
        >
          {isActive ? "查看流转" : "查看流转"}
        </Button>
      </div>
    </li>
  );
}

export function CalendarSidePanel({
  month,
  selectedDate,
  today,
  allActions,
  hk,
  onSelectDate,
}: {
  month: Date;
  selectedDate: Date;
  today: Date;
  allActions: CalendarAction[];
  hk?: string;
  onSelectDate: (date: Date) => void;
}) {
  const dayActions = actionsForDate(
    allActions,
    formatDateKey(selectedDate)
  );
  const scheduleTitle = isSameDay(selectedDate, today)
    ? `今日安排（${dayActions.length}）`
    : `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日安排（${dayActions.length}）`;

  const soon = dueSoonActions(allActions);
  const overdue = overdueActions(allActions);

  return (
    <aside className="space-y-4" aria-label="日历侧栏">
      <MiniCalendar
        month={month}
        selectedDate={selectedDate}
        today={today}
        onSelectDate={onSelectDate}
      />

      <section className="rounded-xl border border-border bg-card p-3">
        <h3 className="mb-2 text-sm font-semibold">{scheduleTitle}</h3>
        {dayActions.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-xs">
            当日暂无安排
          </p>
        ) : (
          <ul>
            {dayActions.map((item) => (
              <ScheduleItem key={item.id} item={item} hk={hk} />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-3">
        <h3 className="mb-2 text-sm font-semibold">
          即将到期（{soon.length}）
        </h3>
        {soon.length === 0 ? (
          <p className="text-muted-foreground text-xs">暂无高优待办</p>
        ) : (
          <ul className="space-y-2">
            {soon.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {item.relatedObject.name}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 border-red-200 bg-red-50 text-red-700"
                >
                  最高优先级
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-3">
        <h3 className="mb-2 text-sm font-semibold">
          逾期提醒（{overdue.length}）
        </h3>
        {overdue.length === 0 ? (
          <p className="text-muted-foreground text-xs">暂无逾期行动</p>
        ) : (
          <ul className="space-y-2">
            {overdue.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {item.assignee} · {item.relatedObject.name}
                  </p>
                </div>
                <Badge variant="destructive" className="shrink-0">
                  逾期 {overdueDays(item.date)} 天
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
