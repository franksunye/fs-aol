import type { SuggestionDoc } from "@/lib/suggestions";
import { CaseSection } from "./case-section";

/** 判断依据（原因摘要见页眉，此处不重复）。 */
export function AgentSummaryCard({ suggestion }: { suggestion: SuggestionDoc }) {
  const mood = suggestion.客户情绪?.trim();
  const basis = (suggestion.优先级依据 ?? []).filter((line) => line?.trim());

  if (!mood && basis.length === 0) {
    return (
      <CaseSection
        title="判断依据"
        className="border-l-4 border-l-primary"
        bodyClassName="bg-agent-surface/30"
      >
        <p className="text-muted-foreground text-sm">暂无补充依据</p>
      </CaseSection>
    );
  }

  return (
    <CaseSection
      title="判断依据"
      className="border-l-4 border-l-primary"
      bodyClassName="bg-agent-surface/30"
    >
      {mood ? (
        <p className="text-muted-foreground mb-2 text-xs">客户情绪 · {mood}</p>
      ) : null}
      {basis.length > 0 ? (
        <ul className="text-muted-foreground space-y-1 text-xs leading-relaxed">
          {basis.slice(0, 5).map((line) => (
            <li key={line}>· {line}</li>
          ))}
        </ul>
      ) : null}
    </CaseSection>
  );
}
