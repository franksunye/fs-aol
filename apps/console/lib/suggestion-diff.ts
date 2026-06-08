import type { SuggestionDoc } from "./suggestions";

export interface FieldDiff {
  field: string;
  prev: string;
  cur: string;
  changed: boolean;
}

function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

export function diffSuggestions(
  prev: SuggestionDoc,
  cur: SuggestionDoc
): FieldDiff[] {
  const prevPlan = prev.跟进方案 ?? {};
  const curPlan = cur.跟进方案 ?? {};

  const pairs: { field: string; prev: string; cur: string }[] = [
    { field: "优先级", prev: str(prev.优先级), cur: str(cur.优先级) },
    { field: "原因摘要", prev: str(prev.原因摘要), cur: str(cur.原因摘要) },
    { field: "主行动", prev: str(prevPlan.主行动), cur: str(curPlan.主行动) },
    {
      field: "客户情绪",
      prev: str(prev.客户情绪),
      cur: str(cur.客户情绪),
    },
  ];

  return pairs
    .filter((p) => p.prev || p.cur)
    .map((p) => ({
      ...p,
      changed: p.prev !== p.cur,
    }));
}

export function hasSuggestionChanges(diffs: FieldDiff[]): boolean {
  return diffs.some((d) => d.changed);
}
