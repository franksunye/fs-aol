import type { ReactNode } from "react";
import { Sparkles, TrendingUp, Wallet, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatDeltaPercent,
  formatStaleDelta,
  type AnalyticsSnapshot,
} from "@/lib/analytics";
import { formatYuanCompact } from "@/lib/action-review-metric-cards";

function Delta({
  text,
  tone,
  positiveIsGood = true,
}: {
  text: string;
  tone: "up" | "down" | "flat" | "na";
  positiveIsGood?: boolean;
}) {
  const good =
    tone === "flat" || tone === "na"
      ? false
      : positiveIsGood
        ? tone === "up"
        : tone === "down";
  const bad =
    tone !== "flat" && tone !== "na" && !good;

  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        tone === "na" || tone === "flat"
          ? "text-muted-foreground"
          : good
            ? "text-emerald-600"
            : bad
              ? "text-amber-700"
              : "text-muted-foreground"
      )}
    >
      {text}
    </span>
  );
}

function MetricCard({
  label,
  value,
  footer,
  icon,
  highlight,
}: {
  label: string;
  value: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "gap-2 rounded-xl border-border p-5 shadow-sm",
        highlight ? "border-emerald-200/80 bg-emerald-50/40" : "bg-card"
      )}
    >
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

export function AnalyticsMetricCards({ data }: { data: AnalyticsSnapshot }) {
  const discoveredDelta = formatDeltaPercent(
    data.discovered,
    data.prevDiscovered
  );
  const amountDelta = formatDeltaPercent(
    data.drivenAmount,
    data.prevDrivenAmount
  );
  const staleDelta = formatStaleDelta(data.avgStaleDays, data.prevAvgStaleDays);

  return (
    <section
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="分析指标"
    >
      <MetricCard
        label="发现机会"
        value={data.discovered}
        icon={<Sparkles className="text-primary size-3.5" aria-hidden />}
        footer={<Delta {...discoveredDelta} />}
      />
      <MetricCard
        label="推动行动"
        value={data.actions}
        icon={<TrendingUp className="size-3.5 text-violet-600" aria-hidden />}
        footer={
          <span className="text-muted-foreground text-xs">
            成功率{" "}
            <span className="text-foreground font-medium tabular-nums">
              {data.successRate}%
            </span>
            {data.discovered > 0 ? (
              <span className="text-muted-foreground">
                {" "}
                · {data.actions}/{data.discovered} 条已处置
              </span>
            ) : null}
          </span>
        }
      />
      <MetricCard
        label="推动金额"
        value={
          data.drivenAmount > 0
            ? formatYuanCompact(data.drivenAmount)
            : "—"
        }
        icon={<Wallet className="size-3.5 text-emerald-600" aria-hidden />}
        highlight={data.drivenAmount > 0}
        footer={<Delta {...amountDelta} />}
      />
      <MetricCard
        label="平均停滞时长"
        value={
          data.avgStaleDays != null ? `${data.avgStaleDays} 天` : "—"
        }
        icon={<Clock className="size-3.5" aria-hidden />}
        footer={<Delta {...staleDelta} positiveIsGood={false} />}
      />
    </section>
  );
}
