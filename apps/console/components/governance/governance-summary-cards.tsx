import type { ReactNode } from "react";
import {
  CircleDollarSign,
  GitBranch,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatBudgetYuan,
  type GovernanceSummary,
} from "@/lib/governance-mock";

function Delta({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  if (value === 0) {
    return (
      <span className="text-muted-foreground text-[11px]">较上月 +0{suffix}</span>
    );
  }
  const sign = value > 0 ? "+" : "";
  return (
    <span className="text-emerald-600 text-[11px] tabular-nums">
      较上月 {sign}
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  delta,
  deltaPrefix,
  deltaSuffix,
  icon,
  iconClassName,
}: {
  label: string;
  value: ReactNode;
  delta: number;
  deltaPrefix?: string;
  deltaSuffix?: string;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <Card className="gap-1.5 rounded-xl border-border bg-card p-4 shadow-sm">
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
      <Delta value={delta} prefix={deltaPrefix} suffix={deltaSuffix} />
    </Card>
  );
}

export function GovernanceSummaryCards({
  summary,
}: {
  summary: GovernanceSummary;
}) {
  return (
    <section
      className="grid grid-cols-2 gap-2 xl:grid-cols-4"
      aria-label="治理概览"
    >
      <SummaryCard
        label="角色"
        value={summary.roles}
        delta={summary.rolesDelta}
        icon={<Users className="size-3.5" aria-hidden />}
        iconClassName="bg-primary/10 text-primary"
      />
      <SummaryCard
        label="审批矩阵"
        value={summary.approvalMatrix}
        delta={summary.approvalMatrixDelta}
        icon={<GitBranch className="size-3.5" aria-hidden />}
        iconClassName="bg-violet-100 text-violet-700"
      />
      <SummaryCard
        label="审计事件"
        value={summary.auditEvents}
        delta={summary.auditEventsDelta}
        icon={<ShieldCheck className="size-3.5" aria-hidden />}
        iconClassName="bg-sky-100 text-sky-700"
      />
      <SummaryCard
        label="本月预算"
        value={formatBudgetYuan(summary.monthlyBudgetYuan)}
        delta={summary.monthlyBudgetDelta}
        deltaPrefix="¥"
        icon={<CircleDollarSign className="size-3.5" aria-hidden />}
        iconClassName="bg-emerald-100 text-emerald-700"
      />
    </section>
  );
}
