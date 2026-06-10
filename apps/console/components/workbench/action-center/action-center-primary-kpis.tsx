"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ClipboardList,
  MessageSquare,
  Send,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  primaryKpiHref,
  type ActionCenterPrimaryKpi,
  type ActionCenterPrimaryKpiKey,
} from "@/lib/action-center-nav";

const KPI_ICONS: Record<
  ActionCenterPrimaryKpiKey,
  { icon: ReactNode; iconClassName: string }
> = {
  pendingReview: {
    icon: <ClipboardList className="size-4" aria-hidden />,
    iconClassName: "bg-primary/10 text-primary",
  },
  actionsGenerated: {
    icon: <Zap className="size-4" aria-hidden />,
    iconClassName: "bg-sky-500/10 text-sky-600",
  },
  dispatched: {
    icon: <Send className="size-4" aria-hidden />,
    iconClassName: "bg-emerald-500/10 text-emerald-600",
  },
  feedback: {
    icon: <MessageSquare className="size-4" aria-hidden />,
    iconClassName: "bg-amber-500/10 text-amber-700",
  },
  timeoutAnomaly: {
    icon: <AlertTriangle className="size-4" aria-hidden />,
    iconClassName: "bg-red-500/10 text-red-600",
  },
};

function Delta({ kpi }: { kpi: ActionCenterPrimaryKpi }) {
  if (kpi.delta === 0) {
    return <span className="text-muted-foreground text-[11px]">较昨日 持平</span>;
  }
  const up = kpi.delta > 0;
  const good = kpi.upIsGood ? up : !up;
  const arrow = up ? "↑" : "↓";
  const sign = up ? "+" : "";
  return (
    <span
      className={cn(
        "text-[11px] tabular-nums",
        good ? "text-emerald-600" : "text-red-600"
      )}
    >
      较昨日 {sign}
      {kpi.delta} {arrow}
    </span>
  );
}

export function ActionCenterPrimaryKpis({
  kpis,
  hk,
}: {
  kpis: ActionCenterPrimaryKpi[];
  hk?: string;
}) {
  return (
    <section
      className="mb-4 grid grid-cols-2 gap-2 xl:grid-cols-5"
      aria-label="Action 中心核心指标"
    >
      {kpis.map((kpi) => {
        const { icon, iconClassName } = KPI_ICONS[kpi.key];
        return (
          <Link
            key={kpi.key}
            href={primaryKpiHref(kpi.key, hk)}
            scroll={false}
            className="block"
          >
            <Card className="gap-1.5 rounded-xl border-border bg-card p-3.5 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/20">
              <div className="flex items-start justify-between gap-2">
                <div className="text-muted-foreground text-[11px] font-medium leading-snug">
                  {kpi.label}
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
                {kpi.value}
              </div>
              <Delta kpi={kpi} />
            </Card>
          </Link>
        );
      })}
    </section>
  );
}
