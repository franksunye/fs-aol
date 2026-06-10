import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CALENDAR_PRIORITY_LABELS,
  CALENDAR_STATUS_LABELS,
  type CalendarActionStatus,
  type CalendarPriority,
} from "@/lib/calendar-mock";

const priorityClass: Record<CalendarPriority, string> = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statusClass: Record<CalendarActionStatus, string> = {
  pending: "border-violet-200 bg-violet-50 text-violet-700",
  in_progress: "border-sky-200 bg-sky-50 text-sky-700",
  overdue: "border-red-200 bg-red-50 text-red-700",
  completed: "border-border bg-muted text-muted-foreground",
};

export function CalendarPriorityBadge({
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

export function CalendarStatusBadge({
  status,
  className,
}: {
  status: CalendarActionStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", statusClass[status], className)}
    >
      {CALENDAR_STATUS_LABELS[status]}
    </Badge>
  );
}
