import type { SuggestionDoc } from "@/lib/suggestions";
import { CaseSourceBadge } from "@/components/case/case-source-badge";
import { CaseSection } from "./case-section";

/** Agent 推断：原因摘要 + 优先级依据（不含 Mongo 业务事实）。 */
export function AgentSummaryCard({ suggestion }: { suggestion: SuggestionDoc }) {
  const mood = suggestion.客户情绪?.trim();
  const basis = (suggestion.优先级依据 ?? []).filter((line) => line?.trim());
  const summary = suggestion.原因摘要?.trim();

  if (!mood && basis.length === 0 && !summary) {
    return (
      <CaseSection
        title="Agent 判断"
        action={<CaseSourceBadge kind="agent" />}
        className="border-l-4 border-l-violet-300"
        bodyClassName="bg-agent-surface/30"
      >
        <p className="text-muted-foreground text-sm">暂无 Agent 推断</p>
      </CaseSection>
    );
  }

  return (
    <CaseSection
      title="Agent 判断"
      action={<CaseSourceBadge kind="agent" />}
      className="border-l-4 border-l-violet-300"
      bodyClassName="bg-agent-surface/30"
    >
      {summary ? (
        <p className="text-foreground mb-2 text-sm leading-relaxed">{summary}</p>
      ) : null}
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
