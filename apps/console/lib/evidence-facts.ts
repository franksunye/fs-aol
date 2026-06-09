import type { SuggestionDoc, TraceRow } from "./suggestions";

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return [];
}

/**
 * 关键事实：优先 Action Spec「引用查证」，再补 trace enrich 行（去重）。
 * 与 PUB-13 一致——引用查证必须能对应系统查证，比 UI 估算更可信。
 */
export function mergeEvidenceFacts(
  suggestion: SuggestionDoc,
  trace: TraceRow | null
): { verdict: string; facts: string[] } {
  const enrich = trace?.enrich ?? {};
  const verdict = String(enrich.business_verdict ?? "")
    .replace(/^【结论】\s*/, "")
    .trim();

  const citations = (suggestion.引用查证 ?? []).map((c) => c.trim()).filter(Boolean);
  const fromTrace = asStringList(enrich.evidence_lines).filter(
    (l) => !l.startsWith("业务提示")
  );

  const seen = new Set<string>();
  const facts: string[] = [];
  for (const line of [...citations, ...fromTrace]) {
    if (seen.has(line)) continue;
    seen.add(line);
    facts.push(line);
  }

  return { verdict, facts };
}
