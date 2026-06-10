import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  EXECUTION_STATUS_LABELS,
  type ExecutionStatus,
} from "@/lib/execution-status";
import { CALENDAR_PRIORITY_LABELS, type CalendarPriority } from "@/lib/calendar-mock";

const statusClass: Record<ExecutionStatus, string> = {
  pending_dispatch: "border-violet-200 bg-violet-50 text-violet-700",
  dispatched: "border-sky-200 bg-sky-50 text-sky-700",
  in_progress: "border-blue-200 bg-blue-50 text-blue-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-border bg-muted text-muted-foreground",
  timeout: "border-red-200 bg-red-50 text-red-700",
  no_feedback: "border-amber-200 bg-amber-50 text-amber-800",
};

const priorityClass: Record<CalendarPriority, string> = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function ExecutionStatusBadge({
  status,
  className,
}: {
  status: ExecutionStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", statusClass[status], className)}
    >
      {EXECUTION_STATUS_LABELS[status]}
    </Badge>
  );
}

export function ActionFlowPriorityBadge({
  priority,
  className,
}: {
  priority: CalendarPriority;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", priorityClass[priority], className)}
    >
      {CALENDAR_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
