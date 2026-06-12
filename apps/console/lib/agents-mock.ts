import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ClipboardCheck,
  FileSearch,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  FOLLOW_UP_SKILL,
  QUOTE_REVIEW_SKILL,
  type SkillStatus,
} from "./skills";

export type AgentStatus = SkillStatus;
export type AgentFilterTab = "all" | AgentStatus;
export type AgentBusinessLine = "all" | "Revenue" | "Operations";
export type AgentSortKey = "runsToday" | "adoptionRate" | "name";

export type MockAgent = {
  id: string;
  name: string;
  status: AgentStatus;
  businessLine: Exclude<AgentBusinessLine, "all">;
  beta?: boolean;
  icon: LucideIcon;
  iconClassName: string;
  responsibleStage: string;
  supportedSystems: string;
  runsToday: number;
  adoptionRate: number;
  description: string;
  scope: string[];
  triggers: string[];
  systems: string[];
  metrics: {
    suggestions7d: number;
    adoptionRate: number;
    drivenAmount: number;
  };
  recentRuns: {
    at: string;
    workOrderId: string;
    summary: string;
    outcome: string;
    outcomeTone: "success" | "muted";
  }[];
  autonomous: string[];
  humanApproval: string[];
};

export const AGENT_SUMMARY_STATS = {
  enabledCount: 5,
  runsToday: 126,
  weeklyAdoptionRate: 62,
  coveredStages: 8,
} as const;

export const MOCK_AGENTS: MockAgent[] = [
  {
    id: FOLLOW_UP_SKILL.id,
    name: FOLLOW_UP_SKILL.productName,
    status: FOLLOW_UP_SKILL.status,
    businessLine: FOLLOW_UP_SKILL.businessLine,
    icon: Sparkles,
    iconClassName: "bg-primary/10 text-primary",
    responsibleStage: FOLLOW_UP_SKILL.ui.responsibleStage,
    supportedSystems: FOLLOW_UP_SKILL.ui.supportedSystems,
    runsToday: 42,
    adoptionRate: 68,
    description:
      "聚焦待签约阶段，识别停滞商机并生成跟进建议，帮助管家推动签约与回款。",
    scope: [
      "识别停滞商机与待签约机会",
      "生成跟进建议与话术要点",
      "推送管家待办与企微提醒",
      "汇总处置结果用于复盘",
    ],
    triggers: [
      "已正式报价未签约",
      "工单停滞超过阈值",
      "客户情绪转弱或长时间无互动",
      "报价后 48h 无跟进记录",
    ],
    systems: ["CRM", "FSM", "通话记录", "企微"],
    metrics: {
      suggestions7d: 89,
      adoptionRate: 68,
      drivenAmount: 386_000,
    },
    recentRuns: [
      {
        at: "今天 10:24",
        workOrderId: "WO-2026-0412",
        summary: "识别待签约停滞，建议电话回访确认报价",
        outcome: "建议已采纳",
        outcomeTone: "success",
      },
      {
        at: "今天 09:15",
        workOrderId: "WO-2026-0398",
        summary: "客户 3 天未回复，生成跟进话术",
        outcome: "建议已采纳",
        outcomeTone: "success",
      },
      {
        at: "昨天 16:40",
        workOrderId: "WO-2026-0371",
        summary: "报价后无跟进，推送管家提醒",
        outcome: "待处置",
        outcomeTone: "muted",
      },
    ],
    autonomous: ["发现机会", "生成建议", "推送提醒"],
    humanApproval: ["回写状态", "自动执行"],
  },
  {
    id: "inspection-reminder",
    name: "Inspection Reminder Agent",
    status: "enabled",
    businessLine: "Operations",
    icon: ClipboardCheck,
    iconClassName: "bg-sky-500/10 text-sky-600",
    responsibleStage: "上门前",
    supportedSystems: "FSM · 日历",
    runsToday: 31,
    adoptionRate: 54,
    description: "在上门前自动检查预约与材料准备，减少空跑与改期。",
    scope: ["预约冲突检测", "材料清单核对", "上门前 24h 提醒"],
    triggers: ["预约日前 1 天", "材料未齐", "管家未确认上门"],
    systems: ["FSM", "日历", "短信"],
    metrics: {
      suggestions7d: 52,
      adoptionRate: 54,
      drivenAmount: 0,
    },
    recentRuns: [
      {
        at: "今天 08:02",
        workOrderId: "WO-2026-0401",
        summary: "材料未齐，建议联系客户确认",
        outcome: "建议已采纳",
        outcomeTone: "success",
      },
    ],
    autonomous: ["扫描预约", "生成提醒"],
    humanApproval: ["改期确认", "客户通知"],
  },
  {
    id: "renewal",
    name: "Renewal Agent",
    status: "draft",
    businessLine: "Revenue",
    icon: RefreshCw,
    iconClassName: "bg-violet-500/10 text-violet-600",
    responsibleStage: "维保续约",
    supportedSystems: "CRM · 合同",
    runsToday: 0,
    adoptionRate: 0,
    description: "识别即将到期维保合同，生成续约跟进建议（草稿配置中）。",
    scope: ["到期合同扫描", "续约话术生成"],
    triggers: ["合同 30 天内到期", "历史续约率低"],
    systems: ["CRM", "合同库"],
    metrics: {
      suggestions7d: 0,
      adoptionRate: 0,
      drivenAmount: 0,
    },
    recentRuns: [],
    autonomous: ["扫描到期合同"],
    humanApproval: ["续约报价", "合同签署"],
  },
  {
    id: "sla-escalation",
    name: "SLA Escalation Agent",
    status: "enabled",
    businessLine: "Operations",
    beta: true,
    icon: AlertTriangle,
    iconClassName: "bg-amber-500/10 text-amber-700",
    responsibleStage: "全阶段",
    supportedSystems: "FSM · 工单",
    runsToday: 28,
    adoptionRate: 71,
    description: "监控 SLA 超时风险，自动升级并通知值班主管。",
    scope: ["SLA 超时预警", "升级路径建议", "主管通知"],
    triggers: ["响应超时", "上门超时", "结案超时"],
    systems: ["FSM", "工单", "企微"],
    metrics: {
      suggestions7d: 34,
      adoptionRate: 71,
      drivenAmount: 0,
    },
    recentRuns: [
      {
        at: "今天 11:05",
        workOrderId: "WO-2026-0415",
        summary: "响应 SLA 即将超时，建议升级",
        outcome: "已升级",
        outcomeTone: "success",
      },
    ],
    autonomous: ["SLA 扫描", "升级通知"],
    humanApproval: ["强制结案", "豁免 SLA"],
  },
  {
    id: QUOTE_REVIEW_SKILL.id,
    name: QUOTE_REVIEW_SKILL.productName,
    status: "disabled",
    businessLine: QUOTE_REVIEW_SKILL.businessLine,
    icon: FileSearch,
    iconClassName: "bg-muted text-muted-foreground",
    responsibleStage: QUOTE_REVIEW_SKILL.ui.responsibleStage,
    supportedSystems: QUOTE_REVIEW_SKILL.ui.supportedSystems,
    runsToday: 0,
    adoptionRate: 41,
    description: "复核报价完整性与毛利边界（已停用，仅保留历史配置）。",
    scope: ["报价完整性检查", "毛利边界提示"],
    triggers: ["新报价提交", "毛利低于阈值"],
    systems: ["CRM", "报价引擎"],
    metrics: {
      suggestions7d: 0,
      adoptionRate: 41,
      drivenAmount: 12_000,
    },
    recentRuns: [],
    autonomous: ["报价规则校验"],
    humanApproval: ["调价审批", "特价申请"],
  },
];

export const AGENT_STATUS_LABEL: Record<AgentStatus, string> = {
  enabled: "已启用",
  draft: "草稿",
  disabled: "停用",
};

export const AGENT_FILTER_TABS: { id: AgentFilterTab; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "enabled", label: "已启用" },
  { id: "draft", label: "草稿" },
  { id: "disabled", label: "停用" },
];

export const AGENT_BUSINESS_LINES: { id: AgentBusinessLine; label: string }[] = [
  { id: "all", label: "全部业务线" },
  { id: "Revenue", label: "Revenue" },
  { id: "Operations", label: "Operations" },
];

export const AGENT_SORT_OPTIONS: { id: AgentSortKey; label: string }[] = [
  { id: "runsToday", label: "按今日运行" },
  { id: "adoptionRate", label: "按采纳率" },
  { id: "name", label: "按名称" },
];

export function filterAgents(
  agents: MockAgent[],
  opts: {
    tab: AgentFilterTab;
    businessLine: AgentBusinessLine;
    query: string;
  }
): MockAgent[] {
  const q = opts.query.trim().toLowerCase();
  return agents.filter((agent) => {
    if (opts.tab !== "all" && agent.status !== opts.tab) return false;
    if (
      opts.businessLine !== "all" &&
      agent.businessLine !== opts.businessLine
    ) {
      return false;
    }
    if (q && !agent.name.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function formatAgentYuan(n: number): string {
  if (n >= 10_000) {
    const wan = n / 10_000;
    return wan >= 100
      ? `¥${Math.round(n).toLocaleString("zh-CN")}`
      : `¥${wan % 1 === 0 ? wan : wan.toFixed(1)}万`;
  }
  return `¥${Math.round(n).toLocaleString("zh-CN")}`;
}

export function sortAgents(
  agents: MockAgent[],
  sortKey: AgentSortKey
): MockAgent[] {
  const next = [...agents];
  next.sort((a, b) => {
    if (sortKey === "name") {
      return a.name.localeCompare(b.name, "en");
    }
    if (sortKey === "adoptionRate") {
      return b.adoptionRate - a.adoptionRate;
    }
    return b.runsToday - a.runsToday;
  });
  return next;
}
