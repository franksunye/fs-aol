import type { ReactNode } from "react";
import {
  Bot,
  CircleDot,
  Layers,
  PieChart,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { AGENT_SUMMARY_STATS } from "@/lib/agents-mock";

function SummaryCard({
  label,
  value,
  icon,
  iconClassName,
}: {
  label: string;
  value: string | number;
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

export function AgentsSummaryCards() {
  const { enabledCount, runsToday, weeklyAdoptionRate, coveredStages } =
    AGENT_SUMMARY_STATS;

  return (
    <section
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Agent 团队概览"
    >
      <SummaryCard
        label="已启用 Agents"
        value={enabledCount}
        icon={<Bot className="size-4" aria-hidden />}
        iconClassName="bg-primary/10 text-primary"
      />
      <SummaryCard
        label="今日运行"
        value={runsToday}
        icon={<CircleDot className="size-4" aria-hidden />}
        iconClassName="bg-sky-500/10 text-sky-600"
      />
      <SummaryCard
        label="本周采纳率"
        value={`${weeklyAdoptionRate}%`}
        icon={<PieChart className="size-4" aria-hidden />}
        iconClassName="bg-emerald-500/10 text-emerald-600"
      />
      <SummaryCard
        label="覆盖业务阶段"
        value={coveredStages}
        icon={<Layers className="size-4" aria-hidden />}
        iconClassName="bg-amber-500/10 text-amber-700"
      />
    </section>
  );
}
