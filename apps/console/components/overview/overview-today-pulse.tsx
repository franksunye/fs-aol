import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { overviewActionsHref, overviewPendingReviewHref } from "@/lib/overview-nav";
import type { OverviewTodayPulse } from "@/lib/overview-mock";

function Delta({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="text-muted-foreground text-xs">较昨日 持平</span>;
  }
  const up = delta > 0;
  return (
    <span className={cn("text-xs tabular-nums", up ? "text-emerald-600" : "text-red-600")}>
      较昨日 {up ? "+" : ""}
      {delta} {up ? "↑" : "↓"}
    </span>
  );
}

export function OverviewTodayPulseBar({
  today,
  hk,
}: {
  today: OverviewTodayPulse;
  hk?: string;
}) {
  return (
    <section
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      aria-label="今日产出"
    >
      <Link href={overviewPendingReviewHref(hk)} scroll={false} className="block">
        <Card className="flex h-full flex-col justify-center gap-1 rounded-xl border-border bg-card px-4 py-3.5 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/20">
          <span className="text-muted-foreground text-[11px] font-medium">今日建议</span>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-foreground text-2xl font-semibold tabular-nums tracking-tight">
              {today.suggestionsToday}
            </span>
            <Delta delta={today.suggestionsDelta} />
          </div>
        </Card>
      </Link>
      <Link href={overviewActionsHref(hk)} scroll={false} className="block">
        <Card className="flex h-full flex-col justify-center gap-1 rounded-xl border-border bg-card px-4 py-3.5 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/20">
          <span className="text-muted-foreground text-[11px] font-medium">今日 Actions</span>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-foreground text-2xl font-semibold tabular-nums tracking-tight">
              {today.actionsToday}
            </span>
            <Delta delta={today.actionsDelta} />
          </div>
        </Card>
      </Link>
    </section>
  );
}
