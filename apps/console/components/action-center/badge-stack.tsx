"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ListBadge } from "@/lib/list-display";

export function BadgeStack({
  items,
  max = 3,
  size = "sm",
}: {
  items: ListBadge[];
  max?: number;
  size?: "sm" | "xs";
}) {
  const visible = items.slice(0, max);
  const overflow = items.slice(max);

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      {visible.map((item) => (
        <Badge
          key={item.key}
          variant={item.variant ?? "outline"}
          className={cn(
            size === "xs" ? "text-[10px]" : "text-[11px]",
            item.className
          )}
        >
          {item.label}
        </Badge>
      ))}
      {overflow.length > 0 ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Badge
                variant="secondary"
                className={cn(
                  "cursor-default tabular-nums",
                  size === "xs" ? "text-[10px]" : "text-[11px]"
                )}
              />
            }
          >
            +{overflow.length}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <ul className="space-y-0.5 text-xs">
              {overflow.map((item) => (
                <li key={item.key}>{item.label}</li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
