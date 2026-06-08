import type { TraceRow } from "./suggestions";
import { statusLabel } from "./labels";

/** 与引擎默认 REANALYZE_* 一致 */
export const REANALYZE_INTERVAL_DAYS = 3;
export const REANALYZE_STALE_STEP_DAYS = 7;

function parseMs(iso: string | null | undefined): number | null {
  if (!iso?.trim()) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

/** state_at（北京墙上时间）→ 在 atMs 时刻的滞留天数 */
export function staleDaysAt(stateAt: string | null | undefined, atMs: number): number | null {
  if (!stateAt?.trim()) return null;
  const s = stateAt.trim().replace("Z", "").slice(0, 19).replace(" ", "T");
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(s);
  if (!m) return null;
  const startMs = Date.UTC(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]) - 8,
    Number(m[5]),
    Number(m[6])
  );
  const delta = atMs - startMs;
  if (delta < 0) return 0;
  return Math.floor(delta / 86_400_000);
}

export function daysBetweenIso(a: string, b: string): number | null {
  const am = parseMs(a);
  const bm = parseMs(b);
  if (am == null || bm == null) return null;
  return Math.max(0, Math.floor(Math.abs(bm - am) / 86_400_000));
}

/** 再分析轮次的触发原因标签（推断，与 time_trigger 规则对齐） */
export function reanalysisTriggerTags(opts: {
  roundIndex: number;
  trace: TraceRow;
  prevTrace: TraceRow | null;
  stateAt: string | null;
  outcomeFollowedUpAt?: string | null;
  intervalDays?: number;
  stepDays?: number;
}): string[] {
  if (opts.roundIndex <= 0 || !opts.prevTrace) return [];

  const interval = opts.intervalDays ?? REANALYZE_INTERVAL_DAYS;
  const step = opts.stepDays ?? REANALYZE_STALE_STEP_DAYS;
  const tags: string[] = [];

  const gap = daysBetweenIso(opts.prevTrace.createdAt, opts.trace.createdAt);
  if (gap != null && gap >= interval) {
    tags.push(`间隔触发（距上轮 ${gap} 天，≥${interval} 天）`);
  }

  const atMs = parseMs(opts.trace.createdAt);
  const prevMs = parseMs(opts.prevTrace.createdAt);
  if (atMs != null && prevMs != null && opts.stateAt) {
    const staleNow = staleDaysAt(opts.stateAt, atMs);
    const stalePrev = staleDaysAt(opts.stateAt, prevMs);
    if (
      staleNow != null &&
      stalePrev != null &&
      staleNow >= stalePrev + step
    ) {
      tags.push(`滞留加重（${stalePrev}→${staleNow} 天，+${step} 天台阶）`);
    }
  }

  const followMs = parseMs(opts.outcomeFollowedUpAt);
  if (followMs != null && atMs != null && atMs > followMs) {
    tags.push("管家已跟进后再分析");
  }

  if (tags.length === 0) {
    tags.push("再分析（规则入池）");
  }
  return tags;
}

export type WecomPushMeta = {
  label: string;
  tone: "sent" | "muted" | "warn";
};

/** 最新一轮的企微推送外显（来自 follow_up_logs.status） */
export function wecomPushMeta(
  logStatus: string,
  opts: { isLatestRound: boolean; isReanalysis: boolean }
): WecomPushMeta | null {
  if (!opts.isLatestRound) return null;

  const s = logStatus.trim();
  if (!opts.isReanalysis) {
    if (s === "sent") return { label: "企微已推送", tone: "sent" };
    if (s === "send_failed") return { label: "企微推送失败", tone: "warn" };
    return null;
  }

  switch (s) {
    case "reanalyzed":
      return { label: "再分析 · 企微已推送", tone: "sent" };
    case "reanalyzed_no_push":
      return { label: "再分析 · 未推送企微（优先级未升）", tone: "muted" };
    case "reanalyzed_send_failed":
      return { label: "再分析 · 企微推送失败", tone: "warn" };
    case "reanalyzed_skipped_no_follow_up":
      return { label: "再分析 · 判定无需跟进", tone: "muted" };
    default:
      return { label: `引擎：${statusLabel(s)}`, tone: "muted" };
  }
}
