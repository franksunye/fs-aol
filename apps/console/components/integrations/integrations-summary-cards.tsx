import type { ReactNode } from "react";
import { Activity, CheckCircle2, Link2, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { INTEGRATIONS_SUMMARY } from "@/lib/integrations-mock";

function SummaryCard({
  label,
  value,
  icon,
  iconClassName,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <Card className="gap-2 rounded-xl border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="text-muted-foreground text-xs font-medium">{label}</div>
        <span
          className={`flex size-8 items-center justify-center rounded-lg ${iconClassName}`}
        >
          {icon}
        </span>
      </div>
      <div className="text-foreground text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
    </Card>
  );
}

export function IntegrationsSummaryCards({
  connectedSystems,
  healthySync,
  pendingConfig,
  eventsToday,
}: {
  connectedSystems?: number;
  healthySync?: number;
  pendingConfig?: number;
  eventsToday?: number;
} = {}) {
  const summary = INTEGRATIONS_SUMMARY;
  const values = {
    connectedSystems: connectedSystems ?? summary.connectedSystems,
    healthySync: healthySync ?? summary.healthySync,
    pendingConfig: pendingConfig ?? summary.pendingConfig,
    eventsToday: eventsToday ?? summary.eventsToday,
  };

  return (
    <section
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="系统集成概览"
    >
      <SummaryCard
        label="已连接系统"
        value={values.connectedSystems}
        icon={<Link2 className="size-4" aria-hidden />}
        iconClassName="bg-primary/10 text-primary"
      />
      <SummaryCard
        label="健康同步"
        value={values.healthySync}
        icon={<CheckCircle2 className="size-4" aria-hidden />}
        iconClassName="bg-emerald-500/10 text-emerald-600"
      />
      <SummaryCard
        label="待配置"
        value={values.pendingConfig}
        icon={<Settings2 className="size-4" aria-hidden />}
        iconClassName="bg-amber-500/10 text-amber-700"
      />
      <SummaryCard
        label="今日事件"
        value={values.eventsToday.toLocaleString("zh-CN")}
        icon={<Activity className="size-4" aria-hidden />}
        iconClassName="bg-sky-500/10 text-sky-600"
      />
    </section>
  );
}
