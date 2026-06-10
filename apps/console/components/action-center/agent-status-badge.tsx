import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AGENT_STATUS_LABELS,
  type AgentRowStatus,
} from "@/lib/agent-status";

const STYLES: Record<AgentRowStatus, string> = {
  pending_reanalyze: "bg-violet-100 text-violet-800 border-violet-200",
  analyzed: "bg-slate-100 text-slate-700 border-slate-200",
  handled: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

export function AgentStatusBadge({ status }: { status: AgentRowStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium", STYLES[status])}
    >
      {AGENT_STATUS_LABELS[status]}
    </Badge>
  );
}
