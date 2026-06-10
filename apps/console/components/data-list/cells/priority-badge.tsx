import { cn } from "@/lib/utils";

export function PriorityBadge({ label }: { label: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[2rem] justify-center rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums",
        label === "高" && "bg-red-50 text-red-600",
        label === "中" && "bg-amber-50 text-amber-700",
        label === "低" && "bg-emerald-50 text-emerald-700",
        label !== "高" && label !== "中" && label !== "低" && "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  );
}
