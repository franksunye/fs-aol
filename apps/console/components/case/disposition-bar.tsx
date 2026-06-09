import type { Decision, SuggestionDoc } from "@/lib/suggestions";
import { DecisionActions } from "@/components/decision-actions";
import { BlockerFeedbackForm } from "@/components/blocker-feedback";
import type { BlockerType } from "@/lib/blockers";

export function DispositionBar({
  dedupeKey,
  workOrderId,
  suggestion,
  currentDecision,
  blockerType,
  blockerNote,
}: {
  dedupeKey: string;
  workOrderId: string;
  suggestion: SuggestionDoc;
  currentDecision: Decision | null;
  blockerType: BlockerType | null;
  blockerNote: string | null;
}) {
  return (
    <div className="bg-background/95 sticky top-0 z-20 -mx-6 border-b border-border px-6 py-3 backdrop-blur lg:-mx-8 lg:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground mb-2 text-xs font-medium">
            人在回路 · 审批 Agent 建议
          </p>
          <DecisionActions
            dedupeKey={dedupeKey}
            workOrderId={workOrderId}
            suggestion={suggestion}
            currentDecision={currentDecision}
          />
        </div>
        <div className="w-full lg:max-w-sm">
          <BlockerFeedbackForm
            dedupeKey={dedupeKey}
            workOrderId={workOrderId}
            currentType={blockerType}
            currentNote={blockerNote}
          />
        </div>
      </div>
    </div>
  );
}
