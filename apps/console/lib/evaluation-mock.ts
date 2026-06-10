import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Calculator,
  ClipboardList,
  Coins,
  FileSearch,
  Sparkles,
} from "lucide-react";
import { RUNS_HOME_PATH, runDetailHref } from "./runs-nav";
import { workbenchHref, workbenchPaneHref } from "./workbench-nav";
import { myActionHref } from "./my-actions-mock";

export const EVALUATION_HOME_PATH = "/analytics";

export type EvaluationRangeKey = "last_7" | "last_30" | "week" | "month";

export type EvaluationFilters = {
  range: EvaluationRangeKey;
  site: string;
  agentId: string;
  actionType: string;
};

export type EvaluationKpi = {
  key: string;
  label: string;
  value: string;
  deltaText: string;
  tone: "up" | "down" | "flat";
  positiveIsGood: boolean;
  icon: LucideIcon;
  iconClassName: string;
};

export type EvaluationTrendPoint = {
  label: string;
  value: number;
};

export type EvaluationActionStatusSeries = {
  key: string;
  label: string;
  color: string;
  values: number[];
};

export type EvaluationAgentRow = {
  id: string;
  name: string;
  icon: LucideIcon;
  iconClassName: string;
  suggestions: number;
  adoptionRate: number;
  feedbackRate: number;
  completionRate: number;
  businessValue: number;
};

export type EvaluationProblemCase = {
  rank: number;
  topic: string;
  count: number;
  hrefQuery?: Record<string, string>;
};

export type EvaluationRoleInsight = {
  role: string;
  users: number;
  deltaText: string;
};

export type EvaluationModuleInsight = {
  label: string;
  value: number;
  deltaText: string;
  icon: LucideIcon;
  iconClassName: string;
};

export type EvaluationQualitySample = {
  time: string;
  agentName: string;
  actionLabel: string;
  issue: string;
  suggestion: string;
  tag: "false_positive" | "needs_edit";
  actionId?: string;
  runId?: string;
  workOrderKey?: string;
};

export type EvaluationSnapshot = {
  filters: EvaluationFilters;
  kpis: EvaluationKpi[];
  suggestionTrend: EvaluationTrendPoint[];
  actionStatusTrend: {
    labels: string[];
    series: EvaluationActionStatusSeries[];
  };
  agents: EvaluationAgentRow[];
  problemCases: EvaluationProblemCase[];
  roles: EvaluationRoleInsight[];
  modules: EvaluationModuleInsight[];
  qualitySamples: EvaluationQualitySample[];
};

export const EVALUATION_RANGE_OPTIONS = [
  { id: "last_7", label: "近 7 天" },
  { id: "last_30", label: "近 30 天" },
  { id: "week", label: "本周" },
  { id: "month", label: "本月" },
] as const;

export const EVALUATION_SITE_OPTIONS = [
  { id: "all", label: "全部站点" },
  { id: "sz", label: "深圳站" },
  { id: "sh", label: "上海站" },
  { id: "bj", label: "北京站" },
] as const;

export const EVALUATION_AGENT_OPTIONS = [
  { id: "all", label: "全部 Agent" },
  { id: "follow-up", label: "Follow-up Agent" },
  { id: "estimate", label: "Estimate Agent" },
  { id: "inspection", label: "Inspection Agent" },
  { id: "collection", label: "Collection Agent" },
] as const;

export const EVALUATION_ACTION_TYPE_OPTIONS = [
  { id: "all", label: "全部类型" },
  { id: "follow-up", label: "跟进回访" },
  { id: "quote", label: "报价生成" },
  { id: "inspection", label: "巡检提醒" },
  { id: "collection", label: "催收跟进" },
] as const;

export function parseEvaluationRangeKey(value?: string | null): EvaluationRangeKey {
  const v = value?.trim();
  if (v === "last_7" || v === "last_30" || v === "week" || v === "month") {
    return v;
  }
  return "last_7";
}

export function getEvaluationSnapshot(
  filters: Partial<EvaluationFilters> = {}
): EvaluationSnapshot {
  const resolved: EvaluationFilters = {
    range: parseEvaluationRangeKey(filters.range),
    site: filters.site?.trim() || "all",
    agentId: filters.agentId?.trim() || "all",
    actionType: filters.actionType?.trim() || "all",
  };

  return {
    filters: resolved,
    kpis: EVALUATION_KPIS,
    suggestionTrend: SUGGESTION_TREND,
    actionStatusTrend: ACTION_STATUS_TREND,
    agents: AGENT_ROWS,
    problemCases: PROBLEM_CASES,
    roles: ROLE_INSIGHTS,
    modules: MODULE_INSIGHTS,
    qualitySamples: QUALITY_SAMPLES,
  };
}

const EVALUATION_KPIS: EvaluationKpi[] = [
  {
    key: "suggestions",
    label: "建议数",
    value: "128",
    deltaText: "较前 7 天 ↑12%",
    tone: "up",
    positiveIsGood: true,
    icon: Sparkles,
    iconClassName: "bg-primary/10 text-primary",
  },
  {
    key: "adoption",
    label: "采纳率",
    value: "78%",
    deltaText: "较前 7 天 ↑6pp",
    tone: "up",
    positiveIsGood: true,
    icon: Bot,
    iconClassName: "bg-sky-100 text-sky-700",
  },
  {
    key: "modified",
    label: "修改率",
    value: "12%",
    deltaText: "较前 7 天 ↓2pp",
    tone: "down",
    positiveIsGood: true,
    icon: ClipboardList,
    iconClassName: "bg-amber-100 text-amber-700",
  },
  {
    key: "rejected",
    label: "拒绝率",
    value: "10%",
    deltaText: "较前 7 天 ↓3pp",
    tone: "down",
    positiveIsGood: true,
    icon: FileSearch,
    iconClassName: "bg-red-100 text-red-600",
  },
  {
    key: "feedback",
    label: "反馈率",
    value: "72%",
    deltaText: "较前 7 天 ↑5pp",
    tone: "up",
    positiveIsGood: true,
    icon: Bot,
    iconClassName: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "completion",
    label: "Action 完成率",
    value: "68%",
    deltaText: "较前 7 天 ↑4pp",
    tone: "up",
    positiveIsGood: true,
    icon: Calculator,
    iconClassName: "bg-violet-100 text-violet-700",
  },
  {
    key: "value",
    label: "业务价值(估算)",
    value: "¥328,600",
    deltaText: "较前 7 天 ↑18%",
    tone: "up",
    positiveIsGood: true,
    icon: Coins,
    iconClassName: "bg-primary/10 text-primary",
  },
];

const SUGGESTION_TREND: EvaluationTrendPoint[] = [
  { label: "05/30", value: 12 },
  { label: "05/31", value: 16 },
  { label: "06/01", value: 18 },
  { label: "06/02", value: 21 },
  { label: "06/03", value: 25 },
  { label: "06/04", value: 31 },
  { label: "06/05", value: 35 },
];

const ACTION_STATUS_TREND = {
  labels: ["05/30", "05/31", "06/01", "06/02", "06/03", "06/04", "06/05"],
  series: [
    {
      key: "dispatched",
      label: "已分发",
      color: "#22c55e",
      values: [18, 22, 24, 26, 28, 30, 32],
    },
    {
      key: "in_progress",
      label: "执行中",
      color: "#3b82f6",
      values: [12, 14, 15, 16, 18, 19, 20],
    },
    {
      key: "feedback",
      label: "已反馈",
      color: "#f59e0b",
      values: [8, 10, 11, 13, 14, 16, 18],
    },
    {
      key: "timeout",
      label: "超时/异常",
      color: "#ef4444",
      values: [3, 4, 3, 5, 4, 6, 5],
    },
  ] satisfies EvaluationActionStatusSeries[],
};

const AGENT_ROWS: EvaluationAgentRow[] = [
  {
    id: "follow-up",
    name: "Follow-up Agent",
    icon: Sparkles,
    iconClassName: "bg-primary/10 text-primary",
    suggestions: 92,
    adoptionRate: 81,
    feedbackRate: 62,
    completionRate: 51,
    businessValue: 98000,
  },
  {
    id: "estimate",
    name: "Estimate Agent",
    icon: Calculator,
    iconClassName: "bg-sky-100 text-sky-700",
    suggestions: 69,
    adoptionRate: 42,
    feedbackRate: 67,
    completionRate: 38,
    businessValue: 86000,
  },
  {
    id: "inspection",
    name: "Inspection Agent",
    icon: FileSearch,
    iconClassName: "bg-amber-100 text-amber-700",
    suggestions: 58,
    adoptionRate: 39,
    feedbackRate: 44,
    completionRate: 35,
    businessValue: 72000,
  },
  {
    id: "collection",
    name: "Collection Agent",
    icon: Coins,
    iconClassName: "bg-emerald-100 text-emerald-700",
    suggestions: 48,
    adoptionRate: 31,
    feedbackRate: 36,
    completionRate: 28,
    businessValue: 59000,
  },
];

const PROBLEM_CASES: EvaluationProblemCase[] = [
  {
    rank: 1,
    topic: "低置信度规则建议",
    count: 18,
    hrefQuery: { tab: "active", priority: "高" },
  },
  {
    rank: 2,
    topic: "Action 超时过多",
    count: 14,
    hrefQuery: { tab: "actions", aquick: "overdue" },
  },
  {
    rank: 3,
    topic: "集成写回失败",
    count: 11,
    hrefQuery: { rquick: "anomaly" },
  },
  {
    rank: 4,
    topic: "重复建议",
    count: 9,
    hrefQuery: { tab: "active" },
  },
  {
    rank: 5,
    topic: "信息不完整导致拒绝",
    count: 7,
    hrefQuery: { tab: "closed" },
  },
];

const ROLE_INSIGHTS: EvaluationRoleInsight[] = [
  { role: "运营管理员", users: 12, deltaText: "↑8%" },
  { role: "销售经理", users: 28, deltaText: "↑5%" },
  { role: "财务主管", users: 6, deltaText: "↑2%" },
];

const MODULE_INSIGHTS: EvaluationModuleInsight[] = [
  {
    label: "待签约",
    value: 128,
    deltaText: "↑12%",
    icon: Sparkles,
    iconClassName: "bg-primary/10 text-primary",
  },
  {
    label: "报价管理",
    value: 86,
    deltaText: "↑9%",
    icon: Calculator,
    iconClassName: "bg-sky-100 text-sky-700",
  },
  {
    label: "巡检工单",
    value: 64,
    deltaText: "↑6%",
    icon: FileSearch,
    iconClassName: "bg-amber-100 text-amber-700",
  },
  {
    label: "回款催收",
    value: 52,
    deltaText: "↑4%",
    icon: Coins,
    iconClassName: "bg-emerald-100 text-emerald-700",
  },
];

const QUALITY_SAMPLES: EvaluationQualitySample[] = [
  {
    time: "06/05 10:23",
    agentName: "Follow-up Agent",
    actionLabel: "电话回访",
    issue: "客户已成交仍建议回访，触发条件未识别最新状态",
    suggestion: "优化客户状态识别规则",
    tag: "false_positive",
    actionId: "ma-1",
    runId: "RUN-20250609-1287",
    workOrderKey: "demo:sz-zhizao-001",
  },
  {
    time: "06/05 09:48",
    agentName: "Estimate Agent",
    actionLabel: "报价生成",
    issue: "报价金额与历史区间偏差过大，缺少折扣说明",
    suggestion: "复核价格区间与折扣规则",
    tag: "needs_edit",
    actionId: "ma-2",
    runId: "RUN-20250609-1287",
  },
  {
    time: "06/04 16:12",
    agentName: "Inspection Agent",
    actionLabel: "巡检提醒",
    issue: "重复推送同一工单巡检提醒，未去重",
    suggestion: "增加巡检 Action 去重窗口",
    tag: "false_positive",
    actionId: "ma-4",
  },
  {
    time: "06/04 11:05",
    agentName: "Collection Agent",
    actionLabel: "催收跟进",
    issue: "客户已部分回款仍触发全额催收话术",
    suggestion: "同步回款进度后再生成 Action",
    tag: "needs_edit",
    workOrderKey: "demo:sz-zhizao-001",
  },
  {
    time: "06/03 15:40",
    agentName: "Follow-up Agent",
    actionLabel: "停滞唤醒",
    issue: "建议话术与客户行业不匹配，采纳后被修改",
    suggestion: "补充行业模板与上下文摘要",
    tag: "needs_edit",
    actionId: "ma-4",
    runId: "RUN-20250609-1287",
  },
];

export function evaluationHref(
  patch: Partial<Record<string, string | undefined>>,
  sp: URLSearchParams
): string {
  const q = new URLSearchParams(sp.toString());
  const keys = ["range", "esite", "eagent", "eaction", "hk"] as const;
  for (const key of keys) {
    if (!(key in patch)) continue;
    const value = patch[key]?.trim();
    if (!value || (key !== "hk" && value === "all")) q.delete(key);
    else q.set(key, value);
  }
  if (patch.range === "last_7") q.delete("range");
  const s = q.toString();
  return s ? `${EVALUATION_HOME_PATH}?${s}` : EVALUATION_HOME_PATH;
}

export function evaluationFiltersFromSearchParams(sp: {
  range?: string;
  esite?: string;
  eagent?: string;
  eaction?: string;
}): EvaluationFilters {
  return {
    range: parseEvaluationRangeKey(sp.range),
    site: sp.esite?.trim() || "all",
    agentId: sp.eagent?.trim() || "all",
    actionType: sp.eaction?.trim() || "all",
  };
}

export function evaluationAgentsHref(agentId?: string, hk?: string): string {
  const q = new URLSearchParams();
  const mapped =
    agentId === "inspection"
      ? "inspection-reminder"
      : agentId === "estimate"
        ? "quote-review"
        : agentId === "collection"
          ? "renewal"
          : agentId;
  if (mapped && mapped !== "all") q.set("agent", mapped);
  if (hk) q.set("hk", hk);
  const s = q.toString();
  return s ? `/agents?${s}` : "/agents";
}

export function evaluationWorkbenchActiveHref(hk?: string): string {
  return workbenchHref({ hk, from: "active" });
}

export function evaluationActionsHref(
  hk?: string,
  extra?: Record<string, string>
): string {
  const q = new URLSearchParams();
  q.set("tab", "actions");
  if (hk) q.set("hk", hk);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) q.set(k, v);
    }
  }
  return `/?${q.toString()}`;
}

export function evaluationProblemCaseHref(
  item: EvaluationProblemCase,
  hk?: string
): string {
  const q = item.hrefQuery ?? {};
  if (q.rquick) {
    const runsQ = new URLSearchParams();
    runsQ.set("rquick", q.rquick);
    if (hk) runsQ.set("hk", hk);
    return `${RUNS_HOME_PATH}?${runsQ.toString()}`;
  }
  const workbenchQ = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v) workbenchQ.set(k, v);
  }
  if (hk) workbenchQ.set("hk", hk);
  const s = workbenchQ.toString();
  return s ? `/?${s}` : "/";
}

export function evaluationSampleHref(
  sample: EvaluationQualitySample,
  hk?: string
): string {
  if (sample.actionId) return myActionHref(sample.actionId, hk);
  if (sample.runId) return runDetailHref(sample.runId, hk);
  if (sample.workOrderKey) {
    return workbenchPaneHref(sample.workOrderKey, { hk, from: "active" });
  }
  return evaluationWorkbenchActiveHref(hk);
}

export function formatEvaluationYuan(value: number): string {
  if (value >= 10000) {
    return `¥${Math.round(value / 1000) / 10}万`;
  }
  return `¥${value.toLocaleString("zh-CN")}`;
}

export const QUALITY_SAMPLE_TAG_LABELS = {
  false_positive: "误报",
  needs_edit: "需修改",
} as const;
