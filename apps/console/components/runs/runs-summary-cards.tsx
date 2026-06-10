import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDuration, type RunsSummary } from "@/lib/runs-mock";

function Delta({
  value,
  suffix = "",
  invert = false,
}: {
  value: number;
  suffix?: string;
  invert?: boolean;
}) {
  if (value === 0) {
    return <span className="text-muted-foreground text-[11px]">较昨日 持平</span>;
  }
  const up = value > 0;
  const good = invert ? !up : up;
  const arrow = up ? "↑" : "↓";
  const text = `较昨日 ${up ? "+" : ""}${value}${suffix} ${arrow}`;
  return (
    <span
      className={cn(
        "text-[11px] tabular-nums",
        good ? "text-emerald-600" : "text-amber-700"
      )}
    >
      {text}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  delta,
  deltaSuffix,
  icon,
  iconClassName,
  invertDelta,
}: {
  label: string;
  value: ReactNode;
  delta: number;
  deltaSuffix?: string;
  icon: ReactNode;
  iconClassName: string;
  invertDelta?: boolean;
}) {
  return (
    <Card className="gap-1.5 rounded-xl border-border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="text-muted-foreground text-[11px] font-medium">{label}</div>
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
      <Delta value={delta} suffix={deltaSuffix} invert={invertDelta} />
    </Card>
  );
}

export function RunsSummaryCards({ summary }: { summary: RunsSummary }) {
  return (
    <section
      className="grid grid-cols-2 gap-2 xl:grid-cols-4"
      aria-label="Runs 概览"
    >
      <SummaryCard
        label="今日 Runs"
        value={summary.todayRuns}
        delta={summary.todayRunsDelta}
        icon={<Play className="size-3.5" aria-hidden />}
        iconClassName="bg-primary/10 text-primary"
      />
      <SummaryCard
        label="成功"
        value={summary.success}
        delta={summary.successDelta}
        icon={<CheckCircle2 className="size-3.5" aria-hidden />}
        iconClassName="bg-emerald-100 text-emerald-700"
      />
      <SummaryCard
        label="异常"
        value={summary.anomaly}
        delta={summary.anomalyDelta}
        icon={<AlertTriangle className="size-3.5" aria-hidden />}
        iconClassName="bg-red-100 text-red-600"
      />
      <SummaryCard
        label="平均耗时"
        value={formatDuration(summary.avgDurationSec)}
        delta={summary.avgDurationDelta}
        deltaSuffix="s"
        invertDelta
        icon={<Clock className="size-3.5" aria-hidden />}
        iconClassName="bg-sky-100 text-sky-700"
      />
    </section>
  );
}
