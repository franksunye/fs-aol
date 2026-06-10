import type { GovernanceModuleKey } from "./governance-nav";
import { GOVERNANCE_HOME_PATH } from "./governance-nav";
import { INTEGRATIONS_HOME_PATH } from "./integrations-nav";
import { RUNS_HOME_PATH } from "./runs-nav";
import { AI_INFRASTRUCTURE_PATH } from "./settings-nav";

export type GovernancePermission = "view" | "edit" | "approve" | "publish";

export type GovernanceRole = {
  id: string;
  name: string;
  permissions: Partial<Record<GovernanceModuleKey, GovernancePermission[]>>;
};

export type ApprovalMatrixRule = {
  id: string;
  ruleType: string;
  scope: string;
  approvers: string;
  condition: string;
  href?: string;
};

export type DataResourcePolicy = {
  id: string;
  resource: string;
  access: "read" | "restricted";
  href?: string;
};

export type ModelAccessPolicy = {
  id: string;
  model: string;
  access: "read" | "write" | "restricted";
  href?: string;
};

export type ReleaseEnvironment = {
  id: string;
  name: string;
  requiresApproval: boolean;
  rollbackEnabled: boolean;
  checklist: { id: string; label: string; passed: boolean }[];
};

export type AuditLogEntry = {
  id: string;
  userName: string;
  userInitials: string;
  avatarClassName: string;
  action: string;
  timestamp: string;
  href?: string;
};

export type RiskAlert = {
  id: string;
  level: "high" | "medium";
  message: string;
  href?: string;
};

export type GovernanceSummary = {
  roles: number;
  rolesDelta: number;
  approvalMatrix: number;
  approvalMatrixDelta: number;
  auditEvents: number;
  auditEventsDelta: number;
  monthlyBudgetYuan: number;
  monthlyBudgetDelta: number;
  budgetUsedYuan: number;
  budgetWarningPct: number;
  budgetHardLimitPct: number;
};

export const GOVERNANCE_PERMISSION_LABELS: Record<
  GovernancePermission,
  { label: string; className: string }
> = {
  view: {
    label: "查看",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  edit: {
    label: "编辑",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  approve: {
    label: "审批",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  publish: {
    label: "发布",
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
};

export const GOVERNANCE_SUMMARY: GovernanceSummary = {
  roles: 6,
  rolesDelta: 1,
  approvalMatrix: 4,
  approvalMatrixDelta: 0,
  auditEvents: 238,
  auditEventsDelta: 32,
  monthlyBudgetYuan: 8000,
  monthlyBudgetDelta: 0,
  budgetUsedYuan: 4862,
  budgetWarningPct: 80,
  budgetHardLimitPct: 100,
};

export const GOVERNANCE_ROLES: GovernanceRole[] = [
  {
    id: "ops-admin",
    name: "运营管理员",
    permissions: {
      overview: ["view", "edit"],
      actions: ["view", "edit", "approve"],
      runs: ["view"],
      agents: ["view", "edit"],
      integrations: ["view"],
      analytics: ["view"],
      settings: ["view"],
    },
  },
  {
    id: "sales-manager",
    name: "销售经理",
    permissions: {
      overview: ["view"],
      actions: ["view", "edit", "approve"],
      runs: ["view"],
      agents: ["view"],
      integrations: ["view"],
      analytics: ["view"],
    },
  },
  {
    id: "finance-lead",
    name: "财务主管",
    permissions: {
      overview: ["view"],
      actions: ["view", "approve"],
      runs: ["view"],
      analytics: ["view", "edit"],
      settings: ["view"],
    },
  },
  {
    id: "system-admin",
    name: "系统管理员",
    permissions: {
      overview: ["view", "edit", "publish"],
      actions: ["view", "edit", "approve", "publish"],
      runs: ["view", "edit", "publish"],
      agents: ["view", "edit", "publish"],
      integrations: ["view", "edit", "publish"],
      analytics: ["view", "edit"],
      settings: ["view", "edit", "publish"],
    },
  },
];

export const GOVERNANCE_APPROVAL_MATRIX: ApprovalMatrixRule[] = [
  {
    id: "crm-writeback",
    ruleType: "自动写回 CRM",
    scope: "CRM 写回类 Actions",
    approvers: "销售经理 + 系统管理员",
    condition: "涉及客户信息或商机状态变更",
    href: "/?tab=actions",
  },
  {
    id: "high-priority-review",
    ruleType: "高优先级建议复核",
    scope: "Follow-up Agent 建议",
    approvers: "运营管理员",
    condition: "优先级为高且金额影响超过 ¥50,000",
    href: "/",
  },
  {
    id: "model-strategy",
    ruleType: "模型策略变更",
    scope: "Agent 模型配置",
    approvers: "系统管理员",
    condition: "切换默认模型或提升 token 上限",
    href: "/agents/follow-up/settings/models",
  },
  {
    id: "integration-publish",
    ruleType: "集成配置发布",
    scope: "系统集成连接",
    approvers: "系统管理员 + 财务主管",
    condition: "生产环境启用新写权限或密钥轮换",
    href: INTEGRATIONS_HOME_PATH,
  },
];

export const GOVERNANCE_DATA_POLICIES: DataResourcePolicy[] = [
  {
    id: "crm-customer",
    resource: "CRM 客户资料",
    access: "restricted",
    href: `${INTEGRATIONS_HOME_PATH}?integration=crm-self`,
  },
  {
    id: "call-records",
    resource: "通话记录",
    access: "read",
    href: INTEGRATIONS_HOME_PATH,
  },
  {
    id: "contract-docs",
    resource: "合同与报价文档",
    access: "restricted",
    href: INTEGRATIONS_HOME_PATH,
  },
  {
    id: "work-order",
    resource: "工单与派工数据",
    access: "read",
    href: "/",
  },
];

export const GOVERNANCE_MODEL_POLICIES: ModelAccessPolicy[] = [
  {
    id: "openai",
    model: "OpenAI",
    access: "write",
    href: `${AI_INFRASTRUCTURE_PATH}?provider=openai`,
  },
  {
    id: "claude",
    model: "Claude Sonnet 3.5",
    access: "read",
    href: `${AI_INFRASTRUCTURE_PATH}?provider=anthropic`,
  },
  {
    id: "gpt-mini",
    model: "GPT-4.1 mini",
    access: "write",
    href: `${AI_INFRASTRUCTURE_PATH}?provider=openai`,
  },
  {
    id: "gemini",
    model: "Gemini 1.5 Flash",
    access: "restricted",
    href: `${AI_INFRASTRUCTURE_PATH}?provider=google-gemini`,
  },
];

export const GOVERNANCE_RELEASE_ENVIRONMENTS: ReleaseEnvironment[] = [
  {
    id: "test",
    name: "测试",
    requiresApproval: false,
    rollbackEnabled: true,
    checklist: [
      { id: "perm", label: "权限校验通过", passed: true },
      { id: "backup", label: "备份已创建", passed: true },
      { id: "diff", label: "变更 diff 已审阅", passed: true },
    ],
  },
  {
    id: "prod",
    name: "生产",
    requiresApproval: true,
    rollbackEnabled: true,
    checklist: [
      { id: "perm", label: "权限校验通过", passed: true },
      { id: "backup", label: "备份已创建", passed: true },
      { id: "approval", label: "审批记录已归档", passed: true },
      { id: "monitor", label: "监控告警已启用", passed: true },
    ],
  },
];

export const GOVERNANCE_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "audit-1",
    userName: "张敏",
    userInitials: "张",
    avatarClassName: "bg-violet-100 text-violet-700",
    action: "发布 Governance v0.3.8",
    timestamp: "今天 10:32",
    href: GOVERNANCE_HOME_PATH,
  },
  {
    id: "audit-2",
    userName: "李航",
    userInitials: "李",
    avatarClassName: "bg-sky-100 text-sky-700",
    action: "调整 CRM 写回审批矩阵",
    timestamp: "今天 09:18",
    href: GOVERNANCE_HOME_PATH,
  },
  {
    id: "audit-3",
    userName: "王悦",
    userInitials: "王",
    avatarClassName: "bg-emerald-100 text-emerald-700",
    action: "更新 OpenAI 模型访问范围",
    timestamp: "昨天 17:45",
    href: `${AI_INFRASTRUCTURE_PATH}?provider=openai`,
  },
  {
    id: "audit-4",
    userName: "系统",
    userInitials: "系",
    avatarClassName: "bg-muted text-muted-foreground",
    action: "触发 Run RUN-20250609-1287 异常告警",
    timestamp: "昨天 14:02",
    href: `${RUNS_HOME_PATH}?run=RUN-20250609-1287`,
  },
  {
    id: "audit-5",
    userName: "陈静",
    userInitials: "陈",
    avatarClassName: "bg-amber-100 text-amber-800",
    action: "审批 Action ma-1 写回 CRM",
    timestamp: "昨天 11:26",
    href: "/?tab=actions&action=ma-1",
  },
];

export const GOVERNANCE_RISK_ALERTS: RiskAlert[] = [
  {
    id: "risk-1",
    level: "high",
    message: "2 个高风险动作仍允许自动写回",
    href: "/?tab=actions",
  },
  {
    id: "risk-2",
    level: "medium",
    message: "DeepSeek 访问范围待确认",
    href: `${AI_INFRASTRUCTURE_PATH}?provider=deepseek`,
  },
];

export function getGovernanceMockData() {
  return {
    summary: GOVERNANCE_SUMMARY,
    roles: GOVERNANCE_ROLES,
    approvalMatrix: GOVERNANCE_APPROVAL_MATRIX,
    dataPolicies: GOVERNANCE_DATA_POLICIES,
    modelPolicies: GOVERNANCE_MODEL_POLICIES,
    releaseEnvironments: GOVERNANCE_RELEASE_ENVIRONMENTS,
    auditLogs: GOVERNANCE_AUDIT_LOGS,
    riskAlerts: GOVERNANCE_RISK_ALERTS,
  };
}

export function formatBudgetYuan(value: number): string {
  return `¥${value.toLocaleString("zh-CN")}`;
}

export function budgetUsagePct(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((used / total) * 1000) / 10;
}
