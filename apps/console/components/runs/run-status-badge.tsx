import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RUN_STATUS_LABELS, type RunStatus } from "@/lib/runs-mock";

const statusClass: Record<RunStatus, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  anomaly: "border-red-200 bg-red-50 text-red-700",
  retried: "border-amber-200 bg-amber-50 text-amber-800",
};

export function RunStatusBadge({
  status,
  className,
}: {
  status: RunStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", statusClass[status], className)}
    >
      {RUN_STATUS_LABELS[status]}
    </Badge>
  );
}
