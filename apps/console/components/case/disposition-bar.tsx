import type { Decision, SuggestionDoc } from "@/lib/suggestions";
import { DecisionActions } from "@/components/decision-actions";
import { BlockerFeedbackForm } from "@/components/blocker-feedback";
import type { BlockerType } from "@/lib/blockers";
import { CaseSection } from "./case-section";

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
    <CaseSection title="人在回路 · 审批 Agent 建议" className="mb-5">
      <div className="space-y-4">
        <DecisionActions
          dedupeKey={dedupeKey}
          workOrderId={workOrderId}
          suggestion={suggestion}
          currentDecision={currentDecision}
        />
        <BlockerFeedbackForm
          dedupeKey={dedupeKey}
          workOrderId={workOrderId}
          currentType={blockerType}
          currentNote={blockerNote}
        />
      </div>
    </CaseSection>
  );
}
