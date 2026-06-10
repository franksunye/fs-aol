import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  ListTodo,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CalendarSummary } from "@/lib/calendar-mock";

function SummaryCard({
  label,
  value,
  delta,
  icon,
  iconClassName,
}: {
  label: string;
  value: number;
  delta: number;
  icon: ReactNode;
  iconClassName: string;
}) {
  const deltaText =
    delta === 0 ? "较昨日 持平" : `较昨日 ${delta > 0 ? "+" : ""}${delta}`;

  return (
    <Card className="gap-2 rounded-xl border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="text-muted-foreground text-xs font-medium">{label}</div>
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

export function CalendarSummaryCards({ summary }: { summary: CalendarSummary }) {
  return (
    <section
      className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4"
      aria-label="日历概览"
    >
      <SummaryCard
        label="今日行动"
        value={summary.todayActions}
        delta={summary.todayActionsDelta}
        icon={<ListTodo className="size-4" aria-hidden />}
        iconClassName="bg-primary/10 text-primary"
      />
      <SummaryCard
        label="今日到期"
        value={summary.dueToday}
        delta={summary.dueTodayDelta}
        icon={<Clock className="size-4" aria-hidden />}
        iconClassName="bg-amber-100 text-amber-700"
      />
      <SummaryCard
        label="本周安排"
        value={summary.weeklySchedule}
        delta={summary.weeklyScheduleDelta}
        icon={<CalendarDays className="size-4" aria-hidden />}
        iconClassName="bg-emerald-100 text-emerald-700"
      />
      <SummaryCard
        label="逾期"
        value={summary.overdue}
        delta={summary.overdueDelta}
        icon={<AlertTriangle className="size-4" aria-hidden />}
        iconClassName="bg-red-100 text-red-600"
      />
    </section>
  );
}
