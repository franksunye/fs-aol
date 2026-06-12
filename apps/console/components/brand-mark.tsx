import { cn } from "@/lib/utils";

/** Product mark: purple tile with monogram A (Agent Console / Agent Ops). */
export function BrandMark({
  className,
  letterClassName,
}: {
  className?: string;
  letterClassName?: string;
}) {
  return (
    <div
      className={cn(
        "bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-xl shadow-sm",
        className
      )}
      aria-hidden
    >
      <span
        className={cn(
          "font-bold leading-none tracking-tight select-none",
          letterClassName
        )}
      >
        A
      </span>
    </div>
  );
}
