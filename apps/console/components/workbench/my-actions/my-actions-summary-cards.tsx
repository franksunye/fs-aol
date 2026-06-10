import type { ReactNode } from "react";
import { CheckCircle2, Clock, ListTodo, PlayCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MyActionsSummary } from "@/lib/my-actions-mock";

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
    <Card className="gap-1.5 rounded-xl border-border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="text-muted-foreground text-[11px] font-medium">
          {label}
        </div>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg",
            iconClassName
          )}
        >
          {icon}
        </span>
      </div>
      <div className="text-foreground text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </div>
      <p className="text-muted-foreground text-[11px] tabular-nums">{deltaText}</p>
    </Card>
  );
}

export function MyActionsSummaryCards({
  summary,
}: {
  summary: MyActionsSummary;
}) {
  return (
    <section
      className="mb-3 grid grid-cols-2 gap-2 xl:grid-cols-4"
      aria-label="我的行动概览"
    >
      <SummaryCard
        label="待执行"
        value={summary.pending}
        delta={summary.pendingDelta}
        icon={<ListTodo className="size-3.5" aria-hidden />}
        iconClassName="bg-primary/10 text-primary"
      />
      <SummaryCard
        label="今日到期"
        value={summary.dueToday}
        delta={summary.dueTodayDelta}
        icon={<Clock className="size-3.5" aria-hidden />}
        iconClassName="bg-amber-100 text-amber-700"
      />
      <SummaryCard
        label="进行中"
        value={summary.inProgress}
        delta={summary.inProgressDelta}
        icon={<PlayCircle className="size-3.5" aria-hidden />}
        iconClassName="bg-sky-100 text-sky-700"
      />
      <SummaryCard
        label="已完成"
        value={summary.completed}
        delta={summary.completedDelta}
        icon={<CheckCircle2 className="size-3.5" aria-hidden />}
        iconClassName="bg-emerald-100 text-emerald-700"
      />
    </section>
  );
}
