import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import type { SuggestionRow } from "@/lib/suggestions";
import type { PilotHousekeeper } from "@/lib/pilot-housekeepers";
import {
  decisionLabel,
  priorityClasses,
  decisionClasses,
  encodeKey,
  archiveReasonLabel,
} from "@/lib/labels";
import {
  primaryAction,
  stageBadge,
  resolveStaleDays,
  workOrderContextLine,
  analysisContextLine,
  formatSuggestionIssuedAt,
} from "@/lib/suggestion-list-display";
import { resolveAgentRowStatus } from "@/lib/agent-status";
import { AgentStatusBadge } from "./agent-status-badge";

export function OpportunityRow({
  row,
  pilots,
}: {
  row: SuggestionRow;
  pilots: PilotHousekeeper[];
}) {
  const s = row.suggestion;
  const staleDays = resolveStaleDays(row);
  const href = `/suggestions/${encodeKey(row.dedupeKey)}`;
  const agentStatus = resolveAgentRowStatus(row);

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={priorityClasses(s.优先级)}>
              {s.优先级 || "—"}
            </Badge>
            <AgentStatusBadge status={agentStatus} />
            <span className="font-mono text-sm font-semibold group-hover:text-primary">
              {row.orderNum || row.workOrderId}
            </span>
            {stageBadge(s) ? (
              <Badge variant="outline" className="text-[10px]">
                {stageBadge(s)}
              </Badge>
            ) : null}
            {row.archiveReason ? (
              <Badge variant="secondary" className="text-[10px]">
                {archiveReasonLabel(row.archiveReason)}
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {workOrderContextLine(row, pilots, staleDays)}
          </p>
          <p className="text-sm leading-snug line-clamp-2">
            {primaryAction(s) || analysisContextLine(s)}
          </p>
          <div className="text-muted-foreground flex flex-wrap gap-3 text-[11px] tabular-nums">
            {staleDays != null ? <span>滞留 {staleDays} 天</span> : null}
            <span>{formatSuggestionIssuedAt(row.processedAt)}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge className={decisionClasses(row.outcome?.decision)}>
            {decisionLabel(row.outcome?.decision)}
          </Badge>
          <ChevronRight className="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </Link>
  );
}
