import type { ReactNode } from "react";
import { CheckCircle2, Clock, ListTodo, Radio } from "lucide-react";
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
      aria-label="Action 流转概览"
    >
      <SummaryCard
        label="待分发"
        value={summary.pendingDispatch}
        delta={summary.pendingDispatchDelta}
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
        label="执行中"
        value={summary.inProgress}
        delta={summary.inProgressDelta}
        icon={<Radio className="size-3.5" aria-hidden />}
        iconClassName="bg-sky-100 text-sky-700"
      />
      <SummaryCard
        label="已反馈"
        value={summary.withFeedback}
        delta={summary.withFeedbackDelta}
        icon={<CheckCircle2 className="size-3.5" aria-hidden />}
        iconClassName="bg-emerald-100 text-emerald-700"
      />
    </section>
  );
}
