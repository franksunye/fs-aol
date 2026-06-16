import type { SuggestionDoc } from "./suggestions";
import type { SuggestionRow } from "./suggestions";
import type { PilotHousekeeper } from "./pilot-housekeepers";
import { eventTypeLabel } from "./labels";
import { housekeeperName, resolveExecutorLabel } from "./pilot-housekeepers";

/** 列表四层短标签（详情页仍用「情况判断 / 跟进方案」等完整名） */
export const INBOX_LAYER_LABELS = {
  workOrder: "工单",
  situation: "情况",
  actionPlan: "动作",
  disposition: "反馈",
} as const;

export function primaryAction(s: SuggestionDoc): string {
  const action = s.跟进方案?.主行动?.trim();
  if (action) return action;
  const summary = s.原因摘要?.trim();
  if (summary) return summary.length > 80 ? `${summary.slice(0, 79)}…` : summary;
  return "—";
}

export function quoteLine(s: SuggestionDoc): string {
  const sit = s.情况判断 ?? {};
  const parts: string[] = [];
  if (sit.报价状态) parts.push(sit.报价状态);
  if (sit.金额与方案) {
    const head = sit.金额与方案.split("；")[0]?.trim() ?? "";
    if (head) parts.push(head.length > 36 ? `${head.slice(0, 35)}…` : head);
  }
  return parts.join(" · ") || "—";
}

function truncateListField(text: string, max = 16): string {
  const t = text.trim();
  if (!t) return "—";
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

export function channelPartLine(s: SuggestionDoc): string {
  const raw = s.情况判断?.渠道与部位?.trim();
  if (!raw) return "—";
  const head = raw.split("；")[0]?.trim() ?? raw;
  return head.length > 32 ? `${head.slice(0, 31)}…` : head;
}

/** 列表「部位」列：从 渠道与部位 提取渗漏部位 */
export function repairPartLine(s: SuggestionDoc): string {
  const raw = s.情况判断?.渠道与部位?.trim();
  if (!raw) return "—";

  const labeled = raw.match(/部位[：:]\s*([^；]+)/);
  if (labeled?.[1]) return truncateListField(labeled[1]);

  const parts = raw
    .split("；")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const tail = parts[parts.length - 1]!;
    if (!/渠道/.test(tail)) return truncateListField(tail);
    return truncateListField(parts[1] ?? tail);
  }

  return truncateListField(parts[0] ?? raw);
}

export function stageBadge(s: SuggestionDoc): string | null {
  const stage = s.情况判断?.商机阶段?.trim();
  return stage || null;
}

export interface PushTimeDisplay {
  date: string;
  time: string;
}

/** processed_at：本条「跟进建议」生成/推送时刻（Action 工件时间，≠ 工单滞留） */
export function formatPushTime(iso: string): PushTimeDisplay | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    date: d.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
    }),
    time: d.toLocaleString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

export function formatSuggestionIssuedAt(iso: string): string {
  const t = formatPushTime(iso);
  return t ? `建议 ${t.date} ${t.time}` : "";
}

import {
  computeStaleDaysFromStateAt,
  extractStaleDaysFromSuggestion,
  resolveStaleDays,
} from "./compute-stale-days";

export { computeStaleDaysFromStateAt, resolveStaleDays };

/** @deprecated 使用 extractStaleDaysFromSuggestion */
export const extractStaleDays = extractStaleDaysFromSuggestion;

/** L1 工单：事件、归属、滞留（不含建议推送时间） */
export function workOrderContextLine(
  r: SuggestionRow,
  pilots: PilotHousekeeper[],
  staleDays: number | null
): string {
  const parts = [eventTypeLabel(r.eventType)];
  if (r.city) parts.push(r.city);
  if (pilots.length) parts.push(resolveExecutorLabel(pilots, r));
  if (staleDays) parts.push(`滞留 ${staleDays} 天`);
  return parts.join(" · ");
}

/** L2 分析：Agent 对商机的结构化判断（情况判断 + 优先级已在侧栏） */
export function analysisContextLine(s: SuggestionDoc): string {
  const parts: string[] = [];
  const quote = quoteLine(s);
  if (quote !== "—") parts.push(quote);
  const channel = channelPartLine(s);
  if (channel !== "—") parts.push(channel);
  return parts.join(" · ") || "—";
}

/** L4 反馈：管家回填卡点（decision 由右侧 badge 表达） */
export function dispositionContextLine(blockerLabel: string): string {
  return `卡点 · ${blockerLabel}`;
}
