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
    <Card className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border-border bg-card px-4 py-3 shadow-sm">
      <span className="text-muted-foreground text-[11px] font-medium">今日产出</span>
      <Link
        href={overviewPendingReviewHref(hk)}
        scroll={false}
        className="hover:bg-accent/40 -mx-1 flex items-baseline gap-2 rounded-md px-1 py-0.5 transition-colors"
      >
        <span className="text-muted-foreground text-xs">建议</span>
        <span className="text-foreground text-lg font-semibold tabular-nums">
          {today.suggestionsToday}
        </span>
        <Delta delta={today.suggestionsDelta} />
      </Link>
      <span className="text-border hidden h-4 w-px bg-border sm:block" aria-hidden />
      <Link
        href={overviewActionsHref(hk)}
        scroll={false}
        className="hover:bg-accent/40 -mx-1 flex items-baseline gap-2 rounded-md px-1 py-0.5 transition-colors"
      >
        <span className="text-muted-foreground text-xs">Actions</span>
        <span className="text-foreground text-lg font-semibold tabular-nums">
          {today.actionsToday}
        </span>
        <Delta delta={today.actionsDelta} />
      </Link>
    </Card>
  );
}
