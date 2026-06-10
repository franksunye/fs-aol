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
} from "@/lib/action-center-kpi";

const KPI_ICONS: Record<
  ActionCenterPrimaryKpiKey,
  { icon: ReactNode; iconClassName: string }
> = {
  pendingReview: {
    icon: <ClipboardList aria-hidden />,
    iconClassName: "bg-primary/10 text-primary",
  },
  actionsGenerated: {
    icon: <Zap aria-hidden />,
    iconClassName: "bg-sky-500/10 text-sky-600",
  },
  dispatched: {
    icon: <Send aria-hidden />,
    iconClassName: "bg-emerald-500/10 text-emerald-600",
  },
  feedback: {
    icon: <MessageSquare aria-hidden />,
    iconClassName: "bg-amber-500/10 text-amber-700",
  },
  timeoutAnomaly: {
    icon: <AlertTriangle aria-hidden />,
    iconClassName: "bg-red-500/10 text-red-600",
  },
};

function Delta({ kpi }: { kpi: ActionCenterPrimaryKpi }) {
  if (kpi.delta === 0) {
    return (
      <span className="text-muted-foreground shrink-0 text-[10px] leading-none">
        较昨日 持平
      </span>
    );
  }
  const up = kpi.delta > 0;
  const good = kpi.upIsGood ? up : !up;
  const arrow = up ? "↑" : "↓";
  const sign = up ? "+" : "";
  return (
    <span
      className={cn(
        "shrink-0 text-[10px] leading-none tabular-nums",
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
      className="mb-3 grid grid-cols-2 gap-1.5 xl:grid-cols-5"
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
            <Card className="gap-1 rounded-lg border-border bg-card px-2.5 py-2 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/20">
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md [&_svg]:size-3",
                    iconClassName
                  )}
                >
                  {icon}
                </span>
                <span className="text-muted-foreground min-w-0 truncate text-[11px] font-medium leading-none">
                  {kpi.label}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-foreground text-xl font-semibold leading-none tabular-nums tracking-tight">
                  {kpi.value}
                </span>
                <Delta kpi={kpi} />
              </div>
            </Card>
          </Link>
        );
      })}
    </section>
  );
}
