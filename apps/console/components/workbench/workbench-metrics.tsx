import type { ReactNode } from "react";
import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatYuanCompact,
  type WorkbenchMetricCards,
} from "@/lib/workbench-metrics";

function Delta({
  value,
  format,
  positiveIsGood = true,
}: {
  value: number | null;
  format: (n: number) => string;
  positiveIsGood?: boolean;
}) {
  if (value == null || value === 0) {
    return (
      <span className="text-muted-foreground text-xs">较昨日 持平</span>
    );
  }
  const good = positiveIsGood ? value > 0 : value < 0;
  const sign = value > 0 ? "+" : "";
  return (
    <span
      className={cn(
        "text-xs font-medium tabular-nums",
        good ? "text-primary" : "text-muted-foreground"
      )}
    >
      较昨日 {sign}
      {format(value)}
    </span>
  );
}

function MetricCard({
  label,
  value,
  footer,
  icon,
}: {
  label: string;
  value: ReactNode;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="gap-2 rounded-xl border-border bg-card p-5 shadow-sm">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-foreground text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      {footer ? <div className="pt-0.5">{footer}</div> : null}
    </Card>
  );
}

export function WorkbenchMetrics({ metrics }: { metrics: WorkbenchMetricCards }) {
  return (
    <section
      className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="工作台指标"
    >
      <MetricCard
        label="待处理机会"
        value={metrics.pending}
        footer={
          <Delta value={metrics.pendingDelta} format={(n) => String(n)} />
        }
      />
      <MetricCard
        label="预计可推动金额"
        value={
          metrics.pushableAmount > 0
            ? formatYuanCompact(metrics.pushableAmount)
            : "—"
        }
        footer={
          metrics.amountDelta != null && metrics.amountDelta !== 0 ? (
            <Delta
              value={metrics.amountDelta}
              format={(n) => formatYuanCompact(Math.abs(n))}
            />
          ) : (
            <span className="text-muted-foreground text-xs">
              {metrics.pushableAmount > 0
                ? "基于待处理工单报价汇总"
                : "暂无报价金额"}
            </span>
          )
        }
      />
      <MetricCard
        label="高优先级"
        value={metrics.highPriority}
        icon={<Flame className="size-3.5 text-red-500" aria-hidden />}
        footer={
          <span className="text-muted-foreground text-xs tabular-nums">
            占比 {metrics.highPriorityShare}%
          </span>
        }
      />
      <MetricCard
        label="预计影响提升"
        value={`+${metrics.estimatedImpactPct}%`}
        footer={
          metrics.impactDelta != null && metrics.impactDelta !== 0 ? (
            <Delta
              value={metrics.impactDelta}
              format={(n) => `${n}%`}
            />
          ) : (
            <span className="text-muted-foreground text-xs">
              加权签约率 uplift 估算
            </span>
          )
        }
      />
    </section>
  );
}
