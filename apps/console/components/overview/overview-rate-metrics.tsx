import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatYuanCompact } from "@/lib/format-yuan";
import { overviewAnalyticsHref } from "@/lib/overview-nav";
import type { OverviewRateMetrics } from "@/lib/overview-mock";
import { DataStateBadge } from "@/components/data-state-badge";

function RateDelta({
  value,
  suffix,
  upIsGood = true,
}: {
  value: number;
  suffix: "pp" | "%";
  upIsGood?: boolean;
}) {
  if (value === 0) {
    return <span className="text-muted-foreground text-[11px]">较昨日 持平</span>;
  }
  const up = value > 0;
  const good = upIsGood ? up : !up;
  const sign = up ? "+" : "";
  return (
    <span
      className={cn(
        "text-[11px] tabular-nums",
        good ? "text-emerald-600" : "text-red-600"
      )}
    >
      较昨日 {sign}
      {Math.abs(value)}
      {suffix} {up ? "↑" : "↓"}
    </span>
  );
}

function RateCard({
  label,
  value,
  footer,
  href,
  highlight,
}: {
  label: string;
  value: string;
  footer: React.ReactNode;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link href={href} scroll={false} className="block">
      <Card
        className={cn(
          "gap-1 rounded-xl border-border p-3.5 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/20",
          highlight ? "border-primary/20 bg-primary/[0.03]" : "bg-card"
        )}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
          <span>{label}</span>
          <DataStateBadge state="estimated" className="h-4 px-1.5 text-[10px]" />
        </div>
        <div className="text-foreground text-xl font-semibold tabular-nums tracking-tight">
          {value}
        </div>
        <div>{footer}</div>
      </Card>
    </Link>
  );
}

export function OverviewRateMetrics({
  rates,
  hk,
}: {
  rates: OverviewRateMetrics;
  hk?: string;
}) {
  const analyticsHref = overviewAnalyticsHref(hk);

  return (
    <section
      className="grid grid-cols-2 gap-2 xl:grid-cols-4"
      aria-label="效率与业务影响"
    >
      <RateCard
        label="Action 采纳率"
        value={`${rates.adoptionRate}%`}
        footer={<RateDelta value={rates.adoptionDeltaPp} suffix="pp" />}
        href={analyticsHref}
      />
      <RateCard
        label="反馈率"
        value={`${rates.feedbackRate}%`}
        footer={<RateDelta value={rates.feedbackDeltaPp} suffix="pp" />}
        href={analyticsHref}
      />
      <RateCard
        label="超时率"
        value={`${rates.timeoutRate}%`}
        footer={
          <RateDelta
            value={rates.timeoutDeltaPp}
            suffix="pp"
            upIsGood={false}
          />
        }
        href={analyticsHref}
      />
      <RateCard
        label="业务价值（估算）"
        value={formatYuanCompact(rates.businessValue)}
        footer={
          <RateDelta value={rates.businessValueDeltaPct} suffix="%" />
        }
        href={analyticsHref}
        highlight
      />
    </section>
  );
}
