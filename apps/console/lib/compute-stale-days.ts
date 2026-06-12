import type { SuggestionDoc } from "@/lib/tracking/types";

/** Mongo updateTime（北京本地 naive）→ UTC ms，与引擎 fsm_mongo 口径一致 */
function parseStateAtUtcMs(raw: string): number | null {
  const s = raw.trim().replace("Z", "").slice(0, 19).replace(" ", "T");
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  const se = Number(m[6]);
  return Date.UTC(y, mo - 1, d, h - 8, mi, se);
}

/** 由 state_at 现算滞留天数（随日历推进自动 +1，非入库快照） */
export function computeStaleDaysFromStateAt(
  stateAt: string | null | undefined
): number | null {
  if (!stateAt?.trim()) return null;
  const startMs = parseStateAtUtcMs(stateAt);
  if (startMs == null) return null;
  const delta = Date.now() - startMs;
  if (delta < 0) return 0;
  return Math.floor(delta / 86_400_000);
}

/** 从 LLM 摘要里提取「停留 N 天」（仅旧行回退；新行应读 state_at 现算） */
export function extractStaleDaysFromSuggestion(s: SuggestionDoc): number | null {
  const haystack = [s.原因摘要, ...(s.优先级依据 ?? [])]
    .filter(Boolean)
    .join(" ");
  const m = haystack.match(/(?:停留|已停留)\s*(\d+)\s*天/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function resolveStaleDays(row: {
  stateAt: string | null;
  suggestion: SuggestionDoc;
}): number | null {
  const fromState = computeStaleDaysFromStateAt(row.stateAt);
  if (fromState != null) return fromState;
  return extractStaleDaysFromSuggestion(row.suggestion);
}
