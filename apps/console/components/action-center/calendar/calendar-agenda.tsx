"use client";

import { cn } from "@/lib/utils";
import {
  actionsForDate,
  addDays,
  formatDateKey,
  isSameDay,
  parseDateKey,
  type CalendarAction,
} from "@/lib/calendar-mock";
import { CalendarPriorityBadge, CalendarStatusBadge } from "./calendar-badges";

function groupByDate(actions: CalendarAction[]): Map<string, CalendarAction[]> {
  const map = new Map<string, CalendarAction[]>();
  for (const item of actions) {
    const list = map.get(item.date) ?? [];
    list.push(item);
    map.set(item.date, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return map;
}

function formatAgendaHeading(dateKey: string, today: Date): string {
  const d = parseDateKey(dateKey);
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  const label = `${d.getMonth() + 1}月${d.getDate()}日 周${weekday}`;
  if (isSameDay(d, today)) return `今天 · ${label}`;
  if (isSameDay(d, addDays(today, 1))) return `明天 · ${label}`;
  return label;
}

export function CalendarAgenda({
  actions,
  today,
  mode,
  selectedDate,
}: {
  actions: CalendarAction[];
  today: Date;
  mode: "week" | "list";
  selectedDate: Date;
}) {
  const filtered =
    mode === "week"
      ? actions.filter((a) => {
          const d = parseDateKey(a.date);
          const start = addDays(selectedDate, -((selectedDate.getDay() + 6) % 7));
          const end = addDays(start, 6);
          return d >= start && d <= end;
        })
      : actions;

  const grouped = groupByDate(filtered);
  const dates = [...grouped.keys()].sort();

  if (dates.length === 0) {
    return (
      <div className="text-muted-foreground rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm">
        当前筛选下暂无行动安排
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dates.map((dateKey) => {
        const items = grouped.get(dateKey) ?? [];
        return (
          <section
            key={dateKey}
            className="rounded-xl border border-border bg-card"
          >
            <header className="border-b border-border px-4 py-2.5">
              <h3 className="text-sm font-semibold">
                {formatAgendaHeading(dateKey, today)}
              </h3>
            </header>
            <ul>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                        "bg-primary/10 text-primary"
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{item.title}</p>
                        <CalendarPriorityBadge priority={item.priority} />
                        <CalendarStatusBadge status={item.status} />
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {item.startTime} - {item.endTime} · {item.relatedObject.name}{" "}
                        {item.relatedObject.type} · {item.sourceAgent}
                      </p>
                    </div>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {item.assignee}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
