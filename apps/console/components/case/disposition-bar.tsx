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
    <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
      <CaseSection title="人在回路 · 审批 Agent 建议" className="h-full">
        <DecisionActions
          dedupeKey={dedupeKey}
          workOrderId={workOrderId}
          suggestion={suggestion}
          currentDecision={currentDecision}
        />
      </CaseSection>

      <CaseSection title="卡点（可选）" className="h-full">
        <BlockerFeedbackForm
          dedupeKey={dedupeKey}
          workOrderId={workOrderId}
          currentType={blockerType}
          currentNote={blockerNote}
          compact
        />
      </CaseSection>
    </div>
  );
}
