import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DataListToolbar({
  start,
  end,
  className,
}: {
  start?: ReactNode;
  end?: ReactNode;
  className?: string;
}) {
  if (!start && !end) return null;

  return (
    <div
      className={cn(
        "bg-background flex shrink-0 items-center justify-between gap-3 border-b border-border px-3 py-2",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">{start}</div>
      {end ? <div className="flex shrink-0 items-center gap-2">{end}</div> : null}
    </div>
  );
}
