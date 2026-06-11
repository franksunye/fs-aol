import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  ListTodo,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";
import { cn } from "@/lib/utils";
import type { DataState } from "@/components/data-state-badge";
import type { CalendarSummary } from "@/lib/calendar-mock";

function SummaryCard({
  label,
  value,
  delta,
  icon,
  iconClassName,
  dataState,
}: {
  label: string;
  value: number;
  delta: number;
  icon: ReactNode;
  iconClassName: string;
  dataState: DataState;
}) {
  const deltaText =
    delta === 0 ? "较昨日 持平" : `较昨日 ${delta > 0 ? "+" : ""}${delta}`;

  return (
    <Card className="gap-2 rounded-xl border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground text-xs font-medium">{label}</span>
          <DataStateBadge state={dataState} className="h-4 px-1.5 text-[10px]" />
        </div>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            iconClassName
          )}
        >
          {icon}
        </span>
      </div>
      <div className="text-foreground text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </div>
      <p className="text-muted-foreground text-xs tabular-nums">{deltaText}</p>
    </Card>
  );
}

export function CalendarSummaryCards({
  summary,
  dataState = "live",
}: {
  summary: CalendarSummary;
  dataState?: DataState;
}) {
  return (
    <section
      className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4"
      aria-label="日历概览"
    >
      <SummaryCard
        label="今日 Action"
        value={summary.todayActions}
        delta={summary.todayActionsDelta}
        icon={<ListTodo className="size-4" aria-hidden />}
        iconClassName="bg-primary/10 text-primary"
        dataState={dataState}
      />
      <SummaryCard
        label="今日到期"
        value={summary.dueToday}
        delta={summary.dueTodayDelta}
        icon={<Clock className="size-4" aria-hidden />}
        iconClassName="bg-amber-100 text-amber-700"
        dataState={dataState}
      />
      <SummaryCard
        label="本周安排"
        value={summary.weeklySchedule}
        delta={summary.weeklyScheduleDelta}
        icon={<CalendarDays className="size-4" aria-hidden />}
        iconClassName="bg-emerald-100 text-emerald-700"
        dataState={dataState}
      />
      <SummaryCard
        label="逾期"
        value={summary.overdue}
        delta={summary.overdueDelta}
        icon={<AlertTriangle className="size-4" aria-hidden />}
        iconClassName="bg-red-100 text-red-600"
        dataState={dataState}
      />
    </section>
  );
}
