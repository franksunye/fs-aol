import type { ReactNode } from "react";
import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  formatYuanCompact,
  type WorkbenchMetricCards,
} from "@/lib/workbench-metrics";

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
  const { base } = metrics;

  return (
    <section
      className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="工作台指标"
    >
      <MetricCard
        label="待处理机会"
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
        label="报价池金额"
        value={
          metrics.pushableAmount > 0
            ? formatYuanCompact(metrics.pushableAmount)
            : "—"
        }
        footer={
          <span className="text-muted-foreground text-xs">
            {metrics.quotedCount > 0
              ? `${metrics.quotedCount}/${metrics.pending} 条含可解析报价`
              : "待处理工单暂无金额字段"}
          </span>
        }
      />
      <MetricCard
        label="高优先级"
        value={metrics.highPriority}
        icon={<Flame className="size-3.5 text-red-500" aria-hidden />}
        footer={
          <span className="text-muted-foreground text-xs tabular-nums">
            占待处理 {metrics.highPriorityShare}%
          </span>
        }
      />
      <MetricCard
        label="App 内反馈率"
        value={`${base.handledRate}%`}
        footer={
          <span className="text-muted-foreground text-xs">
            采纳率 {base.adoptionRate}% · 已跟进 {base.followedUp}
          </span>
        }
      />
    </section>
  );
}
