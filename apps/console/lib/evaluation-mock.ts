import { RUNS_HOME_PATH, runDetailHref } from "./runs-nav";
import { actionCenterTabHref, actionReviewPaneHref } from "./action-center-nav";
import { executionActionHref } from "./action-execution-mock";

export const EVALUATION_HOME_PATH = "/analytics";

export type EvaluationRangeKey = "last_7" | "last_30" | "week" | "month";

export type EvaluationFilters = {
  range: EvaluationRangeKey;
  site: string;
  agentId: string;
  actionType: string;
};

export type EvaluationKpiKey =
  | "accuracy"
  | "adoption"
  | "modified"
  | "rejected"
  | "completion"
  | "feedback"
  | "falsePositive";

export type EvaluationOpsMetricKey =
  | "conversionIncrement"
  | "cost"
  | "latency"
  | "roi";

export type EvaluationOpsMetric = {
  key: EvaluationOpsMetricKey;
  label: string;
  value: string;
  deltaText: string;
  tone: "up" | "down" | "flat";
  positiveIsGood: boolean;
  hint?: string;
};

export type EvaluationKpi = {
  key: EvaluationKpiKey;
  label: string;
  value: string;
  deltaText: string;
  tone: "up" | "down" | "flat";
  positiveIsGood: boolean;
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
  suggestions: number;
  accuracyRate: number;
  adoptionRate: number;
  modificationRate: number;
  falsePositiveRate: number;
  feedbackRate: number;
  completionRate: number;
  businessValue: number;
};

export type EvaluationVersionRow = {
  id: string;
  agentName: string;
  version: string;
  suggestions: number;
  accuracyRate: number;
  adoptionRate: number;
  falsePositiveRate: number;
  deployedAt: string;
};

export type EvaluationRuleRow = {
  id: string;
  ruleName: string;
  agentName: string;
  triggerCount: number;
  accuracyRate: number;
  falsePositiveRate: number;
  adoptionRate: number;
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

export type EvaluationModuleKey =
  | "pending_sign"
  | "quote_mgmt"
  | "inspection_wo"
  | "collection";

export type EvaluationModuleInsight = {
  key: EvaluationModuleKey;
  label: string;
  value: number;
  deltaText: string;
};

export type EvaluationQualitySampleTag =
  | "false_positive"
  | "needs_edit"
  | "rejected"
  | "low_confidence";

export type EvaluationQualitySample = {
  time: string;
  agentName: string;
  agentVersion?: string;
  actionLabel: string;
  issue: string;
  suggestion: string;
  tag: EvaluationQualitySampleTag;
  severity: "high" | "medium" | "low";
  actionId?: string;
  runId?: string;
  workOrderKey?: string;
  ruleId?: string;
};

export type EvaluationSnapshot = {
  filters: EvaluationFilters;
  kpis: EvaluationKpi[];
  opsMetrics: EvaluationOpsMetric[];
  suggestionTrend: EvaluationTrendPoint[];
  actionStatusTrend: {
    labels: string[];
    series: EvaluationActionStatusSeries[];
  };
  agents: EvaluationAgentRow[];
  versions: EvaluationVersionRow[];
  rules: EvaluationRuleRow[];
  problemCases: EvaluationProblemCase[];
  roles: EvaluationRoleInsight[];
  modules: EvaluationModuleInsight[];
  qualitySamples: EvaluationQualitySample[];
};

import { FOLLOW_UP_SKILL, skillSourceAgent } from "./skills";

const FOLLOW_UP_AGENT_NAME = FOLLOW_UP_SKILL.productName;

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
  skillSourceAgent(FOLLOW_UP_SKILL.id),
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
    opsMetrics: OPS_METRICS,
    suggestionTrend: SUGGESTION_TREND,
    actionStatusTrend: ACTION_STATUS_TREND,
    agents: AGENT_ROWS,
    versions: VERSION_ROWS,
    rules: RULE_ROWS,
    problemCases: PROBLEM_CASES,
    roles: ROLE_INSIGHTS,
    modules: MODULE_INSIGHTS,
    qualitySamples: QUALITY_SAMPLES,
  };
}

const EVALUATION_KPIS: EvaluationKpi[] = [
  {
    key: "accuracy",
    label: "建议准确率",
    value: "84%",
    deltaText: "较前 7 天 ↑3pp",
    tone: "up",
    positiveIsGood: true,
  },
  {
    key: "adoption",
    label: "采纳率",
    value: "78%",
    deltaText: "较前 7 天 ↑6pp",
    tone: "up",
    positiveIsGood: true,
  },
  {
    key: "modified",
    label: "修改率",
    value: "12%",
    deltaText: "较前 7 天 ↓2pp",
    tone: "down",
    positiveIsGood: true,
  },
  {
    key: "rejected",
    label: "拒绝率",
    value: "10%",
    deltaText: "较前 7 天 ↓3pp",
    tone: "down",
    positiveIsGood: true,
  },
  {
    key: "completion",
    label: "Action 完成率",
    value: "68%",
    deltaText: "较前 7 天 ↑4pp",
    tone: "up",
    positiveIsGood: true,
  },
  {
    key: "feedback",
    label: "反馈率",
    value: "72%",
    deltaText: "较前 7 天 ↑5pp",
    tone: "up",
    positiveIsGood: true,
  },
  {
    key: "falsePositive",
    label: "误报率",
    value: "6%",
    deltaText: "较前 7 天 ↓1pp",
    tone: "down",
    positiveIsGood: true,
  },
];

const OPS_METRICS: EvaluationOpsMetric[] = [
  {
    key: "conversionIncrement",
    label: "业务转化增量",
    value: "¥328,600",
    deltaText: "较前 7 天 ↑18%",
    tone: "up",
    positiveIsGood: true,
    hint: "归因于 Agent 建议的签约/回款增量（估算）",
  },
  {
    key: "cost",
    label: "单次建议成本",
    value: "¥0.42",
    deltaText: "较前 7 天 ↓8%",
    tone: "down",
    positiveIsGood: true,
    hint: "模型推理 + 集成写回均摊",
  },
  {
    key: "latency",
    label: "P95 延迟",
    value: "2.4s",
    deltaText: "较前 7 天 ↓0.3s",
    tone: "down",
    positiveIsGood: true,
    hint: "建议生成至可分发",
  },
  {
    key: "roi",
    label: "ROI（估算）",
    value: "4.2×",
    deltaText: "较前 7 天 ↑0.6×",
    tone: "up",
    positiveIsGood: true,
    hint: "转化增量 / 运行成本",
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
    suggestions: 92,
    accuracyRate: 88,
    adoptionRate: 81,
    modificationRate: 9,
    falsePositiveRate: 4,
    feedbackRate: 62,
    completionRate: 51,
    businessValue: 98000,
  },
  {
    id: "estimate",
    name: "Estimate Agent",
    suggestions: 69,
    accuracyRate: 76,
    adoptionRate: 42,
    modificationRate: 18,
    falsePositiveRate: 8,
    feedbackRate: 67,
    completionRate: 38,
    businessValue: 86000,
  },
  {
    id: "inspection",
    name: "Inspection Agent",
    suggestions: 58,
    accuracyRate: 72,
    adoptionRate: 39,
    modificationRate: 14,
    falsePositiveRate: 9,
    feedbackRate: 44,
    completionRate: 35,
    businessValue: 72000,
  },
  {
    id: "collection",
    name: "Collection Agent",
    suggestions: 48,
    accuracyRate: 68,
    adoptionRate: 31,
    modificationRate: 16,
    falsePositiveRate: 11,
    feedbackRate: 36,
    completionRate: 28,
    businessValue: 59000,
  },
];

const VERSION_ROWS: EvaluationVersionRow[] = [
  {
    id: "follow-up-v2.4",
    agentName: FOLLOW_UP_AGENT_NAME,
    version: "v2.4",
    suggestions: 52,
    accuracyRate: 90,
    adoptionRate: 84,
    falsePositiveRate: 3,
    deployedAt: "05/28",
  },
  {
    id: "follow-up-v2.3",
    agentName: FOLLOW_UP_AGENT_NAME,
    version: "v2.3",
    suggestions: 40,
    accuracyRate: 85,
    adoptionRate: 78,
    falsePositiveRate: 5,
    deployedAt: "05/12",
  },
  {
    id: "estimate-v1.8",
    agentName: "Estimate Agent",
    version: "v1.8",
    suggestions: 38,
    accuracyRate: 79,
    adoptionRate: 45,
    falsePositiveRate: 7,
    deployedAt: "05/20",
  },
  {
    id: "estimate-v1.7",
    agentName: "Estimate Agent",
    version: "v1.7",
    suggestions: 31,
    accuracyRate: 72,
    adoptionRate: 38,
    falsePositiveRate: 10,
    deployedAt: "04/30",
  },
];

const RULE_ROWS: EvaluationRuleRow[] = [
  {
    id: "rule-stale-7d",
    ruleName: "停滞 7 天唤醒",
    agentName: FOLLOW_UP_AGENT_NAME,
    triggerCount: 34,
    accuracyRate: 91,
    falsePositiveRate: 3,
    adoptionRate: 86,
  },
  {
    id: "rule-quote-band",
    ruleName: "报价区间校验",
    agentName: "Estimate Agent",
    triggerCount: 28,
    accuracyRate: 74,
    falsePositiveRate: 9,
    adoptionRate: 41,
  },
  {
    id: "rule-inspection-dup",
    ruleName: "巡检去重窗口",
    agentName: "Inspection Agent",
    triggerCount: 22,
    accuracyRate: 70,
    falsePositiveRate: 12,
    adoptionRate: 36,
  },
  {
    id: "rule-collection-partial",
    ruleName: "部分回款识别",
    agentName: "Collection Agent",
    triggerCount: 19,
    accuracyRate: 65,
    falsePositiveRate: 14,
    adoptionRate: 29,
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
    hrefQuery: { tab: "execution", aquick: "overdue" },
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
    key: "pending_sign",
    label: "待签约",
    value: 128,
    deltaText: "↑12%",
  },
  {
    key: "quote_mgmt",
    label: "报价管理",
    value: 86,
    deltaText: "↑9%",
  },
  {
    key: "inspection_wo",
    label: "巡检工单",
    value: 64,
    deltaText: "↑6%",
  },
  {
    key: "collection",
    label: "回款催收",
    value: 52,
    deltaText: "↑4%",
  },
];

const QUALITY_SAMPLES: EvaluationQualitySample[] = [
  {
    time: "06/05 10:23",
    agentName: FOLLOW_UP_AGENT_NAME,
    agentVersion: "v2.4",
    actionLabel: "电话回访",
    issue: "客户已成交仍建议回访，触发条件未识别最新状态",
    suggestion: "优化客户状态识别规则",
    tag: "false_positive",
    severity: "high",
    actionId: "ma-1",
    runId: "RUN-20250609-1287",
    workOrderKey: "demo:sz-zhizao-001",
    ruleId: "rule-stale-7d",
  },
  {
    time: "06/05 09:48",
    agentName: "Estimate Agent",
    agentVersion: "v1.8",
    actionLabel: "报价生成",
    issue: "报价金额与历史区间偏差过大，缺少折扣说明",
    suggestion: "复核价格区间与折扣规则",
    tag: "needs_edit",
    severity: "high",
    actionId: "ma-2",
    runId: "RUN-20250609-1287",
    ruleId: "rule-quote-band",
  },
  {
    time: "06/04 16:12",
    agentName: "Inspection Agent",
    agentVersion: "v1.2",
    actionLabel: "巡检提醒",
    issue: "重复推送同一工单巡检提醒，未去重",
    suggestion: "增加巡检 Action 去重窗口",
    tag: "false_positive",
    severity: "medium",
    actionId: "ma-4",
    ruleId: "rule-inspection-dup",
  },
  {
    time: "06/04 11:05",
    agentName: "Collection Agent",
    agentVersion: "v1.0",
    actionLabel: "催收跟进",
    issue: "客户已部分回款仍触发全额催收话术",
    suggestion: "同步回款进度后再生成 Action",
    tag: "needs_edit",
    severity: "medium",
    workOrderKey: "demo:sz-zhizao-001",
    ruleId: "rule-collection-partial",
  },
  {
    time: "06/03 15:40",
    agentName: FOLLOW_UP_AGENT_NAME,
    agentVersion: "v2.3",
    actionLabel: "停滞唤醒",
    issue: "建议话术与客户行业不匹配，采纳后被修改",
    suggestion: "补充行业模板与上下文摘要",
    tag: "needs_edit",
    severity: "low",
    actionId: "ma-4",
    runId: "RUN-20250609-1287",
    ruleId: "rule-stale-7d",
  },
  {
    time: "06/03 09:15",
    agentName: "Estimate Agent",
    agentVersion: "v1.7",
    actionLabel: "报价生成",
    issue: "低置信度规则仍自动分发，运营直接拒绝",
    suggestion: "提高置信度阈值或改为人工审核",
    tag: "rejected",
    severity: "high",
    actionId: "ma-2",
    runId: "RUN-20250609-1287",
    ruleId: "rule-quote-band",
  },
  {
    time: "06/02 14:22",
    agentName: "Inspection Agent",
    agentVersion: "v1.2",
    actionLabel: "巡检提醒",
    issue: "置信度 0.52，上下文不足仍生成建议",
    suggestion: "补充工单状态快照后再触发",
    tag: "low_confidence",
    severity: "medium",
    workOrderKey: "demo:sz-zhizao-001",
    ruleId: "rule-inspection-dup",
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

export function evaluationActionReviewHref(hk?: string): string {
  return actionCenterTabHref({ hk, from: "active" });
}

export function evaluationActionsHref(
  hk?: string,
  extra?: Record<string, string>
): string {
  const q = new URLSearchParams();
  q.set("tab", "execution");
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
  if (sample.actionId) return executionActionHref(sample.actionId, hk);
  if (sample.runId) return runDetailHref(sample.runId, hk);
  if (sample.workOrderKey) {
    return actionReviewPaneHref(sample.workOrderKey, { hk, from: "active" });
  }
  return evaluationActionReviewHref(hk);
}

export function formatEvaluationYuan(value: number): string {
  if (value >= 10000) {
    return `¥${Math.round(value / 1000) / 10}万`;
  }
  return `¥${value.toLocaleString("zh-CN")}`;
}

export const QUALITY_SAMPLE_TAG_LABELS: Record<
  EvaluationQualitySampleTag,
  string
> = {
  false_positive: "误报",
  needs_edit: "需修改",
  rejected: "已拒绝",
  low_confidence: "低置信",
};

export function evaluationAgentVersionHref(
  versionId: string,
  hk?: string
): string {
  const q = new URLSearchParams();
  q.set("agent", "follow-up");
  q.set("version", versionId);
  if (hk) q.set("hk", hk);
  return `/agents/follow-up/settings?${q.toString()}`;
}

export function evaluationRuleHref(ruleId: string, hk?: string): string {
  const q = new URLSearchParams();
  q.set("rule", ruleId);
  if (hk) q.set("hk", hk);
  return `/agents?${q.toString()}`;
}

export function evaluationExecutionActionsHref(hk?: string): string {
  const q = new URLSearchParams();
  q.set("tab", "execution");
  if (hk) q.set("hk", hk);
  return `/?${q.toString()}`;
}
