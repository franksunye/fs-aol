import type { Decision, SuggestionDoc } from "@/lib/suggestions";
import { DecisionActions } from "@/components/decision-actions";
import { BlockerFeedbackForm } from "@/components/blocker-feedback";
import { blockerDisplay, type BlockerType } from "@/lib/blockers";
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
      <CaseSection
        title="我的处置"
        className="h-full"
        bodyClassName="p-3"
        action={
          currentDecision ? (
            <span className="text-muted-foreground text-xs font-normal">
              已反馈（可覆盖）
            </span>
          ) : null
        }
      >
        <DecisionActions
          dedupeKey={dedupeKey}
          workOrderId={workOrderId}
          suggestion={suggestion}
        />
      </CaseSection>

      <CaseSection
        title="卡点（可选）"
        className="h-full"
        bodyClassName="p-3"
        action={
          <span className="text-muted-foreground text-xs font-normal">
            当前：{blockerDisplay(blockerType, blockerNote)}
          </span>
        }
      >
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
