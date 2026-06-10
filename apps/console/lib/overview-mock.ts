import { integrationHref } from "./integrations-nav";
import {
  overviewActionsHref,
  overviewAnomalyHref,
  overviewPendingReviewHref,
} from "./overview-nav";

export const OVERVIEW_SIDEBAR_BADGE = 9;

export type OverviewKpiKey =
  | "pendingReview"
  | "actionsGenerated"
  | "dispatched"
  | "feedback"
  | "timeoutAnomaly";

export type OverviewKpi = {
  key: OverviewKpiKey;
  label: string;
  value: number;
  delta: number;
  upIsGood: boolean;
};

export type OverviewTrendPoint = {
  date: string;
  label: string;
  suggestions: number;
  actions: number;
};

export type OverviewActionStatusSlice = {
  key: string;
  label: string;
  count: number;
  percent: number;
  color: string;
};

export type OverviewTopAgent = {
  id: string;
  name: string;
  closedActions: number;
  adoptionRate: number;
};

export type OverviewIntegrationHealth = {
  id: string;
  name: string;
  status: string;
  healthPct: number;
  statusTone?: "normal" | "warn";
};

export type OverviewAttentionItem = {
  id: string;
  title: string;
  description: string;
  badge?: number;
  badgeTone?: "danger" | "warn";
  href: string;
};

export type OverviewSiteOption = {
  id: string;
  label: string;
};

export type OverviewTodayPulse = {
  suggestionsToday: number;
  actionsToday: number;
  suggestionsDelta: number;
  actionsDelta: number;
};

export type OverviewRateMetrics = {
  adoptionRate: number;
  adoptionDeltaPp: number;
  feedbackRate: number;
  feedbackDeltaPp: number;
  timeoutRate: number;
  timeoutDeltaPp: number;
  businessValue: number;
  businessValueDeltaPct: number;
};

export type OverviewAgentRunState = "healthy" | "warn" | "offline" | "draft";

export type OverviewAgentFleetItem = {
  id: string;
  name: string;
  runState: OverviewAgentRunState;
  statusLabel: string;
  runsToday: number;
  lastRunLabel: string;
  agentHrefId: string;
};

export type OverviewDataSource = "live" | "mixed" | "mock";

export type OverviewSnapshot = {
  kpis: OverviewKpi[];
  today: OverviewTodayPulse;
  rates: OverviewRateMetrics;
  agentFleet: OverviewAgentFleetItem[];
  trend: OverviewTrendPoint[];
  actionStatus: {
    total: number;
    slices: OverviewActionStatusSlice[];
  };
  topAgents: OverviewTopAgent[];
  integrationHealth: OverviewIntegrationHealth[];
  attentionItems: OverviewAttentionItem[];
  dataSource: OverviewDataSource;
};

export const OVERVIEW_SITE_OPTIONS: OverviewSiteOption[] = [
  { id: "all", label: "全部站点" },
  { id: "east", label: "华东大区" },
  { id: "south", label: "华南大区" },
  { id: "north", label: "华北大区" },
];

export const OVERVIEW_TODAY: OverviewTodayPulse = {
  suggestionsToday: 35,
  actionsToday: 23,
  suggestionsDelta: 5,
  actionsDelta: 4,
};

export const OVERVIEW_RATES: OverviewRateMetrics = {
  adoptionRate: 78,
  adoptionDeltaPp: 6,
  feedbackRate: 72,
  feedbackDeltaPp: 5,
  timeoutRate: 8,
  timeoutDeltaPp: -2,
  businessValue: 328_600,
  businessValueDeltaPct: 18,
};

export const OVERVIEW_AGENT_FLEET: OverviewAgentFleetItem[] = [
  {
    id: "follow-up",
    name: "Follow-up Agent",
    runState: "healthy",
    statusLabel: "运行正常",
    runsToday: 42,
    lastRunLabel: "今天 10:24",
    agentHrefId: "follow-up",
  },
  {
    id: "estimate",
    name: "Estimate Agent",
    runState: "healthy",
    statusLabel: "运行正常",
    runsToday: 28,
    lastRunLabel: "今天 09:48",
    agentHrefId: "quote-review",
  },
  {
    id: "inspection",
    name: "Inspection Agent",
    runState: "healthy",
    statusLabel: "运行正常",
    runsToday: 31,
    lastRunLabel: "今天 08:02",
    agentHrefId: "inspection-reminder",
  },
  {
    id: "collection",
    name: "Collection Agent",
    runState: "warn",
    statusLabel: "异常偏高",
    runsToday: 18,
    lastRunLabel: "今天 07:15",
    agentHrefId: "follow-up",
  },
];

export const OVERVIEW_KPIS: OverviewKpi[] = [
  { key: "pendingReview", label: "待审核", value: 9, delta: -2, upIsGood: false },
  { key: "actionsGenerated", label: "已生成 Actions", value: 23, delta: 5, upIsGood: true },
  { key: "dispatched", label: "已分发", value: 18, delta: 2, upIsGood: true },
  { key: "feedback", label: "已反馈", value: 16, delta: 3, upIsGood: true },
  { key: "timeoutAnomaly", label: "超时/异常", value: 3, delta: -1, upIsGood: false },
];

export const OVERVIEW_TREND: OverviewTrendPoint[] = [
  { date: "2026-05-30", label: "05/30", suggestions: 18, actions: 12 },
  { date: "2026-05-31", label: "05/31", suggestions: 22, actions: 14 },
  { date: "2026-06-01", label: "06/01", suggestions: 20, actions: 16 },
  { date: "2026-06-02", label: "06/02", suggestions: 25, actions: 18 },
  { date: "2026-06-03", label: "06/03", suggestions: 28, actions: 20 },
  { date: "2026-06-04", label: "06/04", suggestions: 24, actions: 19 },
  { date: "2026-06-05", label: "06/05", suggestions: 30, actions: 23 },
];

const TREND_SHAPE = [
  { suggestions: 18, actions: 12 },
  { suggestions: 22, actions: 14 },
  { suggestions: 20, actions: 16 },
  { suggestions: 25, actions: 18 },
  { suggestions: 28, actions: 20 },
  { suggestions: 24, actions: 19 },
  { suggestions: 30, actions: 23 },
] as const;

function formatDateParts(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return {
    date: `${year}-${month}-${day}`,
    label: `${month}/${day}`,
  };
}

function buildRollingTrend(): OverviewTrendPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return TREND_SHAPE.map((shape, index) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (TREND_SHAPE.length - 1 - index));
    return {
      ...formatDateParts(d),
      suggestions: shape.suggestions,
      actions: shape.actions,
    };
  });
}

export const OVERVIEW_ACTION_STATUS: OverviewSnapshot["actionStatus"] = {
  total: 57,
  slices: [
    { key: "closed", label: "已闭环", count: 16, percent: 28.1, color: "oklch(0.596 0.145 163.225)" },
    { key: "in_progress", label: "进行中", count: 23, percent: 40.4, color: "oklch(0.623 0.214 259.815)" },
    { key: "pending_feedback", label: "待反馈", count: 10, percent: 17.5, color: "oklch(0.795 0.184 86.047)" },
    { key: "timeout", label: "已超时", count: 3, percent: 5.3, color: "oklch(0.637 0.237 25.331)" },
    { key: "anomaly", label: "异常", count: 5, percent: 8.8, color: "oklch(0.541 0.281 293.009)" },
  ],
};

export const OVERVIEW_TOP_AGENTS: OverviewTopAgent[] = [
  { id: "follow-up", name: "Follow-up Agent", closedActions: 24, adoptionRate: 82 },
  { id: "estimate", name: "Estimate Agent", closedActions: 15, adoptionRate: 78 },
  { id: "inspection", name: "Inspection Agent", closedActions: 10, adoptionRate: 75 },
  { id: "collection", name: "Collection Agent", closedActions: 8, adoptionRate: 71 },
];

export const OVERVIEW_INTEGRATION_HEALTH: OverviewIntegrationHealth[] = [
  { id: "crm-self", name: "CRM", status: "运行正常", healthPct: 99 },
  { id: "fsm", name: "FSM", status: "运行正常", healthPct: 98 },
  { id: "call-records", name: "通话记录", status: "运行正常", healthPct: 97 },
  { id: "wecom", name: "企业微信", status: "延迟 2 分钟", healthPct: 86, statusTone: "warn" },
];

export function buildOverviewAttentionItems(hk?: string): OverviewAttentionItem[] {
  return [
    {
      id: "high-priority-review",
      title: "高优先级建议待审核",
      description: "3 条建议等待人工审核处理",
      badge: 3,
      badgeTone: "danger",
      href: overviewPendingReviewHref(hk),
    },
    {
      id: "actions-timeout",
      title: "2 条 Action 即将超时",
      description: "最早将于 1 小时后超时",
      badge: 2,
      badgeTone: "warn",
      href: overviewActionsHref(hk),
    },
    {
      id: "wecom-delay",
      title: "企业微信同步延迟",
      description: "企业微信消息延迟约 2 分钟",
      href: integrationHref("wecom"),
    },
    {
      id: "feedback-rise",
      title: "客户反馈数量较昨日上升",
      description: "较昨日上升 20%，请关注反馈质量",
      href: overviewActionsHref(hk),
    },
  ];
}

export function overviewKpiHref(key: OverviewKpiKey, hk?: string): string {
  switch (key) {
    case "pendingReview":
      return overviewPendingReviewHref(hk);
    case "actionsGenerated":
    case "dispatched":
    case "feedback":
      return overviewActionsHref(hk);
    case "timeoutAnomaly":
      return overviewAnomalyHref(hk);
  }
}

export function getOverviewMockData(
  hk?: string,
  overrides?: Partial<
    Pick<OverviewSnapshot, "kpis" | "today" | "rates" | "dataSource">
  >
): OverviewSnapshot {
  return {
    kpis: overrides?.kpis ?? OVERVIEW_KPIS,
    today: overrides?.today ?? OVERVIEW_TODAY,
    rates: overrides?.rates ?? OVERVIEW_RATES,
    agentFleet: OVERVIEW_AGENT_FLEET,
    trend: buildRollingTrend(),
    actionStatus: OVERVIEW_ACTION_STATUS,
    topAgents: OVERVIEW_TOP_AGENTS,
    integrationHealth: OVERVIEW_INTEGRATION_HEALTH,
    attentionItems: buildOverviewAttentionItems(hk),
    dataSource: overrides?.dataSource ?? "mock",
  };
}
