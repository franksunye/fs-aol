"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  actionsForDate,
  calendarMonthCells,
  formatDateKey,
  isSameDay,
  type CalendarAction,
} from "@/lib/calendar-mock";

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

function DayPopover({
  actions,
  hiddenCount,
}: {
  actions: CalendarAction[];
  hiddenCount: number;
}) {
  return (
    <div className="bg-popover text-popover-foreground absolute top-full left-0 z-20 mt-1 hidden min-w-[12rem] rounded-lg border border-border p-2 shadow-md group-hover/day:block group-focus-within/day:block">
      <ul className="space-y-1 text-xs">
        {actions.map((item) => (
          <li key={item.id} className="truncate">
            <span className="text-muted-foreground tabular-nums">
              {item.startTime}
            </span>{" "}
            {item.title}
          </li>
        ))}
        {hiddenCount > 0 ? (
          <li className="text-primary font-medium">+{hiddenCount} 项</li>
        ) : null}
      </ul>
    </div>
  );
}

export function CalendarMonthGrid({
  month,
  selectedDate,
  today,
  actions,
  onSelectDate,
}: {
  month: Date;
  selectedDate: Date;
  today: Date;
  actions: CalendarAction[];
  onSelectDate: (date: Date) => void;
}) {
  const cells = calendarMonthCells(month);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-muted-foreground px-2 py-2 text-center text-xs font-medium"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date) => {
          const dateKey = formatDateKey(date);
          const inMonth = date.getMonth() === month.getMonth();
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const dayActions = actionsForDate(actions, dateKey);
          const visible = dayActions.slice(0, 3);
          const hiddenCount = Math.max(dayActions.length - visible.length, 0);
          const showPopover =
            hoveredKey === dateKey && dayActions.length > 0;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(date)}
              onMouseEnter={() => setHoveredKey(dateKey)}
              onMouseLeave={() => setHoveredKey(null)}
              className={cn(
                "group/day relative min-h-[5.5rem] border-b border-r border-border p-1.5 text-left transition-colors last:border-r-0",
                inMonth ? "bg-card" : "bg-muted/20",
                isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                "hover:bg-muted/40"
              )}
            >
              <span
                className={cn(
                  "mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : inMonth
                      ? "text-foreground"
                      : "text-muted-foreground"
                )}
              >
                {date.getDate()}
              </span>
              <div className="space-y-0.5">
                {visible.map((item) => (
                  <p
                    key={item.id}
                    className="truncate text-[10px] leading-tight text-foreground"
                  >
                    <span className="text-muted-foreground tabular-nums">
                      {item.startTime}
                    </span>{" "}
                    {item.title}
                  </p>
                ))}
                {hiddenCount > 0 ? (
                  <p className="text-primary text-[10px] font-medium">
                    +{hiddenCount} 项
                  </p>
                ) : null}
              </div>
              {showPopover ? (
                <DayPopover actions={dayActions} hiddenCount={0} />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
