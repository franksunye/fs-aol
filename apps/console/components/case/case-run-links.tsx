import Link from "next/link";
import { formatTraceRunId } from "@/lib/adapters/run";
import { executionActionHref } from "@/lib/action-execution-mock";
import { runDetailHref } from "@/lib/runs-nav";
import { getLatestActionForDedupe } from "@/lib/tracking/actions";
import { listTracesLite } from "@/lib/tracking/traces";
import { CaseSection } from "./case-section";

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
    <div className="mt-4">
      <CaseSection title="信任轨与执行">
      <div className="flex flex-wrap gap-2 text-sm">
        {latest ? (
          <Link
            href={runDetailHref(formatTraceRunId(latest.id), hk)}
            className="text-primary hover:underline"
          >
            查看 Run #{latest.id}
          </Link>
        ) : null}
        {action ? (
          <Link
            href={executionActionHref(String(action.id), hk)}
            className="text-primary hover:underline"
          >
            待执行 Action · {action.status}
          </Link>
        ) : null}
      </div>
      {action?.terminalFeedback ? (
        <p className="text-muted-foreground mt-2 text-xs">
          执行反馈：{action.terminalFeedback}
        </p>
      ) : null}
    </CaseSection>
    </div>
  );
}
