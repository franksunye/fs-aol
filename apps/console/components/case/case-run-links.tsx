import Link from "next/link";
import { formatTraceRunId } from "@/lib/adapters/run";
import { executionActionHref } from "@/lib/action-execution-mock";
import { runDetailHref } from "@/lib/runs-nav";
import { getLatestActionForDedupe } from "@/lib/tracking/actions";
import { listTracesLite } from "@/lib/tracking/traces";

export async function CaseRunLinks({
  dedupeKey,
  workOrderId,
  hk,
}: {
  dedupeKey: string;
  workOrderId: string;
  hk?: string;
}) {
  const [traces, action] = await Promise.all([
    listTracesLite(workOrderId),
    getLatestActionForDedupe(dedupeKey),
  ]);
  const latest = traces[traces.length - 1];
  if (!latest && !action) return null;

  return (
    <footer className="mt-6 border-t border-border pt-4">
      <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide">
        信任轨与执行
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {latest ? (
          <Link
            href={runDetailHref(formatTraceRunId(latest.id), hk)}
            className="text-primary hover:underline"
          >
            Run #{latest.id}
          </Link>
        ) : null}
        {action ? (
          <Link
            href={executionActionHref(String(action.id), hk)}
            className="text-primary hover:underline"
          >
            Action · {action.status}
          </Link>
        ) : null}
      </div>
      {action?.terminalFeedback ? (
        <p className="text-muted-foreground mt-2 text-xs">
          {action.terminalFeedback}
        </p>
      ) : null}
    </footer>
  );
}
