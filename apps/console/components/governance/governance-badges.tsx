import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  GOVERNANCE_PERMISSION_LABELS,
  type GovernancePermission,
} from "@/lib/governance-mock";

export function PermissionBadge({
  permission,
  className,
}: {
  permission: GovernancePermission;
  className?: string;
}) {
  const meta = GOVERNANCE_PERMISSION_LABELS[permission];
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-1.5 py-0 text-[10px] font-medium",
        meta.className,
        className
      )}
    >
      {meta.label}
    </Badge>
  );
}

export function AccessLevelBadge({
  access,
  className,
}: {
  access: "read" | "write" | "restricted";
  className?: string;
}) {
  const labels = {
    read: { label: "只读", className: "border-sky-200 bg-sky-50 text-sky-700" },
    write: {
      label: "可写",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    restricted: {
      label: "受限",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
  } as const;
  const meta = labels[access];
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-1.5 py-0 text-[10px] font-medium",
        meta.className,
        className
      )}
    >
      {meta.label}
    </Badge>
  );
}
