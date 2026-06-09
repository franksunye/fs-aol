import { Card } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/suggestions";

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="gap-1 rounded-xl p-4 shadow-sm">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      {hint ? (
        <div className="text-muted-foreground text-xs">{hint}</div>
      ) : null}
    </Card>
  );
}

export function WorkbenchMetrics({ stats }: { stats: DashboardStats }) {
  return (
    <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        label="待处置机会"
        value={stats.pending}
        hint={`共 ${stats.needFollow} 条需跟进`}
      />
      <MetricCard
        label="高优先级"
        value={stats.byPriority["高"] ?? 0}
        hint={`中 ${stats.byPriority["中"] ?? 0} · 低 ${stats.byPriority["低"] ?? 0}`}
      />
      <MetricCard
        label="待反馈"
        value={stats.pending}
        hint="尚未完成 disposition"
      />
      <MetricCard
        label="App 内反馈率"
        value={`${stats.handledRate}%`}
        hint={`采纳 ${stats.adoptionRate}%`}
      />
    </section>
  );
}
