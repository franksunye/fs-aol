import Link from "next/link";
import { notFound } from "next/navigation";
import { getSuggestion } from "@/lib/suggestions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DecisionActions } from "@/components/decision-actions";
import { BlockerFeedbackForm } from "@/components/blocker-feedback";
import {
  eventTypeLabel,
  statusLabel,
  decisionLabel,
  priorityClasses,
  decisionClasses,
} from "@/lib/labels";
import { primaryAction, resolveStaleDays } from "@/lib/suggestion-list-display";

export const dynamic = "force-dynamic";

export default async function MobileSuggestionAction({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const dedupeKey = decodeURIComponent(key);
  const row = await getSuggestion(dedupeKey);
  if (!row) notFound();

  const s = row.suggestion;
  const stale = resolveStaleDays(row);
  const action = primaryAction(s);

  return (
    <main className="px-4 py-5">
      <Link
        href={`/?hk=${encodeURIComponent(row.housekeeperId)}&sort=stale`}
        className="text-muted-foreground mb-4 inline-block text-sm"
      >
        ← 待办列表
      </Link>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-lg font-semibold">
          {row.orderNum || row.workOrderId}
        </span>
        {stale != null ? (
          <Badge variant="outline" className="tabular-nums">
            滞留 {stale} 天
          </Badge>
        ) : null}
        <Badge className={priorityClasses(s.优先级)}>{s.优先级 || "—"}</Badge>
        <Badge className={decisionClasses(row.outcome?.decision)}>
          {decisionLabel(row.outcome?.decision)}
        </Badge>
      </div>

      <p className="text-muted-foreground mb-4 text-xs">
        {eventTypeLabel(row.eventType)} · {row.city || "—"} ·{" "}
        {statusLabel(row.status)}
      </p>

      <Card className="mb-5 border-primary/20 bg-primary/5 p-4">
        <div className="text-muted-foreground mb-1 text-xs font-medium">现在做什么</div>
        <p className="text-base leading-snug font-medium">{action || "—"}</p>
        {s.原因摘要 ? (
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {s.原因摘要}
          </p>
        ) : null}
      </Card>

      <section className="mb-5 space-y-3">
        <div className="text-muted-foreground text-xs font-medium">处置</div>
        <DecisionActions
          dedupeKey={row.dedupeKey}
          workOrderId={row.workOrderId}
          suggestion={s}
          currentDecision={row.outcome?.decision ?? null}
        />
      </section>

      <section className="mb-6">
        <div className="text-muted-foreground mb-2 text-xs font-medium">阻塞</div>
        <BlockerFeedbackForm
          dedupeKey={row.dedupeKey}
          workOrderId={row.workOrderId}
          currentType={row.blocker?.blockerType ?? null}
          currentNote={row.blocker?.note ?? null}
        />
      </section>

      <Link
        href={`/suggestions/${encodeURIComponent(dedupeKey)}`}
        className="text-primary text-sm underline-offset-2 hover:underline"
      >
        查看完整方案与查证
      </Link>
    </main>
  );
}
