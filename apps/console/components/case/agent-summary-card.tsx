import type { SuggestionDoc } from "@/lib/suggestions";

export function AgentSummaryCard({ suggestion }: { suggestion: SuggestionDoc }) {
  const summary = suggestion.原因摘要?.trim();
  if (!summary) return null;

  return (
    <div className="border-violet-200 bg-agent-surface/80 rounded-xl border-l-4 border-l-primary p-4 shadow-sm">
      <p className="text-primary mb-1 text-xs font-semibold tracking-wide uppercase">
        Agent 洞察
      </p>
      <p className="text-sm leading-relaxed">{summary}</p>
      {suggestion.优先级依据 && suggestion.优先级依据.length > 0 ? (
        <ul className="text-muted-foreground mt-3 space-y-1 text-xs">
          {suggestion.优先级依据.slice(0, 4).map((line) => (
            <li key={line}>· {line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
