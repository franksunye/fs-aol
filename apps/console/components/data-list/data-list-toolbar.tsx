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

  const endOnly = !start && Boolean(end);

  return (
    <div
      className={cn(
        "bg-background flex shrink-0 items-center border-b border-border px-3",
        endOnly ? "justify-end gap-2 py-1" : "justify-between gap-3 py-2",
        className
      )}
    >
      {start ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">{start}</div>
      ) : null}
      {end ? <div className="flex shrink-0 items-center gap-2">{end}</div> : null}
    </div>
  );
}
