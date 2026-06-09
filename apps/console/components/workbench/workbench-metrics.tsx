import type { ReactNode } from "react";
import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatYuanCompact,
  type WorkbenchMetricCards,
} from "@/lib/workbench-metrics";

function MetricCard({
  label,
  value,
  footer,
  icon,
  compact,
}: {
  label: string;
  value: ReactNode;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <Card
      className={cn(
        "gap-1 rounded-lg border-border bg-card shadow-sm",
        compact ? "p-2.5" : "gap-2 rounded-xl p-5"
      )}
    >
      <div className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium">
        {icon}
        <span className={compact ? "truncate" : undefined}>{label}</span>
      </div>
      <div
        className={cn(
          "text-foreground font-semibold tracking-tight tabular-nums",
          compact ? "text-lg leading-none" : "text-3xl"
        )}
      >
        {value}
      </div>
      {footer && !compact ? <div className="pt-0.5">{footer}</div> : null}
    </Card>
  );
}

export function WorkbenchMetrics({
  metrics,
  compact = false,
}: {
  metrics: WorkbenchMetricCards;
  compact?: boolean;
}) {
  const { base } = metrics;

  return (
    <section
      className={cn(
        "grid grid-cols-2 gap-2",
        compact ? "mb-3" : "mb-6 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      )}
      aria-label="工作台指标"
    >
      <MetricCard
        compact={compact}
        label="待处理"
        value={metrics.pending}
        footer={
          <span className="text-muted-foreground text-xs">
            需跟进 {base.needFollow} 条
            {metrics.todayNewInPool > 0
              ? ` · 今日新进池 ${metrics.todayNewInPool}`
              : ""}
          </span>
        }
      />
      <MetricCard
        compact={compact}
        label="报价池"
        value={
          metrics.pushableAmount > 0
            ? formatYuanCompact(metrics.pushableAmount)
            : "—"
        }
        footer={
          <span className="text-muted-foreground text-xs">
            {metrics.quotedCount > 0
              ? `${metrics.quotedCount}/${metrics.pending} 条含报价`
              : "暂无金额字段"}
          </span>
        }
      />
      <MetricCard
        compact={compact}
        label="高优先级"
        value={metrics.highPriority}
        icon={<Flame className="size-3 text-red-500" aria-hidden />}
        footer={
          <span className="text-muted-foreground text-xs tabular-nums">
            占待处理 {metrics.highPriorityShare}%
          </span>
        }
      />
      <MetricCard
        compact={compact}
        label="反馈率"
        value={`${base.handledRate}%`}
        footer={
          <span className="text-muted-foreground text-xs">
            采纳 {base.adoptionRate}% · 已跟进 {base.followedUp}
          </span>
        }
      />
    </section>
  );
}
