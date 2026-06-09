import type { SuggestionDoc } from "@/lib/suggestions";
import { CaseSection } from "./case-section";

export function AgentSummaryCard({ suggestion }: { suggestion: SuggestionDoc }) {
  const summary = suggestion.原因摘要?.trim();

  return (
    <CaseSection
      title="Agent 洞察"
      className="border-l-4 border-l-primary"
      bodyClassName="bg-agent-surface/30"
    >
      {summary ? (
        <>
          {suggestion.客户情绪 ? (
            <p className="text-muted-foreground mb-2 text-xs">
              客户情绪 · {suggestion.客户情绪}
            </p>
          ) : null}
          <p className="text-sm leading-relaxed">{summary}</p>
          {suggestion.优先级依据 && suggestion.优先级依据.length > 0 ? (
            <ul className="text-muted-foreground mt-3 space-y-1 text-xs">
              {suggestion.优先级依据.slice(0, 4).map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <p className="text-muted-foreground text-sm">暂无 Agent 摘要</p>
      )}
    </CaseSection>
  );
}
