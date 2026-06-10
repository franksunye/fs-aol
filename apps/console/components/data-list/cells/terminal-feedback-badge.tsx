import { cn } from "@/lib/utils";
import type { TerminalFeedbackDisplayState } from "@/lib/terminal-feedback-display";

const LABELS: Record<TerminalFeedbackDisplayState, string> = {
  viewed: "已查看",
  no_feedback: "未反馈",
};

export function TerminalFeedbackBadge({
  state,
  className,
}: {
  state: TerminalFeedbackDisplayState;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        state === "viewed" && "bg-emerald-50 text-emerald-700",
        state === "no_feedback" && "bg-muted text-muted-foreground",
        className
      )}
    >
      {LABELS[state]}
    </span>
  );
}
