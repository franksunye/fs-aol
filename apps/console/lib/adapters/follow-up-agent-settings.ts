import type { EngineRuntimeSnapshot } from "@/lib/tracking/engine-runtime";
import type { RuntimeConfigPublic } from "@/lib/runtime-config/store";
import type { RuntimeConfigRevisionSummary } from "@/lib/runtime-config/store";

export type AgentSettingsDataState = "live" | "not_connected" | "scenario";

export type AgentIngestionPolicyRow = {
  id: string;
  name: string;
  mode: string;
  condition: string;
  priority: "P0" | "P1" | "P2";
  enabled: boolean;
  dataState: AgentSettingsDataState;
  editHref?: string;
};

export type AgentDataSourceChip = {
  id: string;
  name: string;
  permissions: ("读" | "写")[];
  dataState: AgentSettingsDataState;
  integrationHref?: string;
};

export type AgentSettingsView = {
  basic: {
    name: string;
    owner: string;
    businessStage: string;
    enabled: boolean;
    description: string;
    serviceLines: string[];
    lastCronAt: string | null;
  };
  ingestionPolicies: AgentIngestionPolicyRow[];
  futureCapabilities: { label: string }[];
  dataSources: AgentDataSourceChip[];
  actions: {
    auto: string[];
    manual: string[];
    governanceHref: string;
  };
  prompt: {
    strategyName: string;
    strategyHint: string;
    modelsHref: string;
    knowledgeBases: { name: string; dataState: AgentSettingsDataState }[];
  };
  notifications: {
    wecomEnabled: boolean;
    wecomConfigured: boolean;
    dryRun: boolean;
    writeBack: { label: string; dataState: AgentSettingsDataState };
    quietHours: { label: string; dataState: AgentSettingsDataState };
  };
  runtimeBehavior: {
    agentMode: string;
    agentModeLabel: string;
    reanalyzeEnabled: boolean;
    consoleBaseUrl: string;
    dryRun: boolean;
  };
  engineSync: {
    configVersion: number;
    configUpdatedAt: string;
    snapshotRunAt: string | null;
    llmProvider: string;
    llmModel: string;
    fsmSource: string;
    pilotCount: number;
    ingestionStatusCount: number;
    dryRun: boolean;
    aligned: boolean;
  };
  summary: {
    status: string;
    connectedSystems: number;
    ingestionPolicies: number;
    configVersion: string;
    lastPublishedAt: string;
  };
  publishHistory: {
    version: string;
    summary: string;
    at: string;
    updatedBy: string | null;
  }[];
};

const AGENT_META = {
  name: "Follow-up Agent",
  owner: "运营团队",
  businessStage: "报价后跟进 / 回款推动",
  description:
    "聚焦待签约阶段，识别停滞商机并生成跟进建议，帮助管家推动签约与回款。",
  serviceLines: ["Revenue 服务线"],
} as const;

const AUTO_ACTIONS = ["生成建议", "推送提醒", "标注优先级", "汇总证据"];
const MANUAL_ACTIONS = [
  "创建任务",
  "更新商机阶段",
  "修改报价方案",
  "发送客户消息",
];

function agentModeLabel(mode: string): string {
  return mode === "steps" ? "分步推理" : "单次推理";
}

function formatRevisionAt(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function buildAgentSettingsView(opts: {
  runtimeConfig: RuntimeConfigPublic | null;
  runtimeBootstrap?: boolean;
  engineSnapshot: EngineRuntimeSnapshot | null;
  revisions: RuntimeConfigRevisionSummary[];
  fsmIntegrationHref: string;
  fsmIngestionHref: string;
}): AgentSettingsView {
  const cfg = opts.runtimeConfig?.config;
  const snap = opts.engineSnapshot?.snapshot;
  const version = opts.runtimeConfig?.version ?? 0;
  const statusRaw = cfg?.fsm_event_statuses ?? snap?.fsm_event_statuses;
  const statuses = (
    Array.isArray(statusRaw)
      ? statusRaw.join(",")
      : String(statusRaw ?? "")
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const staleDays = cfg?.fsm_stale_days ?? snap?.fsm_stale_days ?? 1;
  const pilots = (cfg?.pilot_housekeepers ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const wecomConfigured = Boolean(
    opts.runtimeConfig?.secretsMasked?.wecom_webhook?.includes("•") ||
      (snap?.wecom_configured as boolean | undefined)
  );
  const dryRun = cfg?.dry_run ?? (snap?.dry_run as boolean | undefined) ?? true;
  const agentMode = cfg?.agent_mode ?? (snap?.agent_mode as string) ?? "steps";
  const llmProvider =
    (snap?.llm_provider as string) ?? cfg?.llm_provider ?? "—";
  const llmModel = (snap?.llm_model as string) ?? cfg?.llm_model ?? "—";
  const cronAt = opts.engineSnapshot?.runAt ?? null;
  const enabled = Boolean(cronAt || version > 0);

  const ingestionPolicies: AgentIngestionPolicyRow[] = [
    {
      id: "status-filter",
      name: "工单状态过滤",
      mode: "摄取策略",
      condition: statuses.length
        ? `状态码：${statuses.join("、")}`
        : "未配置状态码",
      priority: "P0",
      enabled: statuses.length > 0,
      dataState: statuses.length ? "live" : "not_connected",
      editHref: opts.fsmIngestionHref,
    },
    {
      id: "stale-threshold",
      name: "停滞阈值",
      mode: "定时扫描",
      condition: `停滞 ≥ ${staleDays} 天`,
      priority: "P1",
      enabled: true,
      dataState: "live",
      editHref: opts.fsmIngestionHref,
    },
    {
      id: "pilot-scope",
      name: "试点管家",
      mode: "范围限制",
      condition: pilots.length
        ? pilots.join("、")
        : "全量管家（未限制试点）",
      priority: "P2",
      enabled: true,
      dataState: pilots.length ? "live" : "not_connected",
      editHref: opts.fsmIngestionHref,
    },
  ];

  const dataSources: AgentDataSourceChip[] = [
    {
      id: "work-order",
      name: "XLink FSM 工单",
      permissions: ["读"],
      dataState: "live",
      integrationHref: opts.fsmIntegrationHref,
    },
    {
      id: "wecom",
      name: "企微通知",
      permissions: ["读"],
      dataState: wecomConfigured ? "live" : "not_connected",
      integrationHref: "/integrations?integration=wecom",
    },
    {
      id: "turso",
      name: "追踪与收件箱",
      permissions: ["读"],
      dataState: version > 0 ? "live" : "not_connected",
    },
    {
      id: "crm-opp",
      name: "CRM 商机",
      permissions: ["读", "写"],
      dataState: "scenario",
    },
    {
      id: "call-log",
      name: "通话记录",
      permissions: ["读"],
      dataState: "scenario",
    },
  ];

  const publishHistory = opts.revisions.map((r) => ({
    version: `v${r.version}`,
    summary: r.changeSummary || "配置更新",
    at: formatRevisionAt(r.updatedAt),
    updatedBy: r.updatedBy,
  }));

  return {
    basic: {
      name: AGENT_META.name,
      owner: AGENT_META.owner,
      businessStage: AGENT_META.businessStage,
      description: AGENT_META.description,
      serviceLines: [...AGENT_META.serviceLines],
      enabled,
      lastCronAt: cronAt,
    },
    ingestionPolicies,
    futureCapabilities: [
      { label: "金额组合规则（高优先级商机）" },
      { label: "报价后 48h 无跟进检测" },
    ],
    dataSources,
    actions: {
      auto: AUTO_ACTIONS,
      manual: MANUAL_ACTIONS,
      governanceHref: "/governance",
    },
    prompt: {
      strategyName: "内置跟进建议策略",
      strategyHint:
        "结合停滞天数、报价状态与工单上下文生成下一步动作（引擎内置 Prompt）",
      modelsHref: "/agents/follow-up/settings/models",
      knowledgeBases: [
        { name: "产品知识库", dataState: "scenario" },
        { name: "销售话术库", dataState: "scenario" },
        { name: "报价规则库", dataState: "scenario" },
      ],
    },
    notifications: {
      wecomEnabled: !dryRun,
      wecomConfigured,
      dryRun,
      writeBack: { label: "未启用 CRM 写回", dataState: "not_connected" },
      quietHours: { label: "未配置", dataState: "not_connected" },
    },
    runtimeBehavior: {
      agentMode,
      agentModeLabel: agentModeLabel(agentMode),
      reanalyzeEnabled: cfg?.reanalyze_enabled ?? false,
      consoleBaseUrl: cfg?.console_base_url ?? "",
      dryRun,
    },
    engineSync: {
      configVersion: version,
      configUpdatedAt: opts.runtimeConfig?.updatedAt ?? "",
      snapshotRunAt: cronAt,
      llmProvider,
      llmModel,
      fsmSource: (cfg?.fsm_source ?? snap?.fsm_source ?? "—") as string,
      pilotCount: pilots.length,
      ingestionStatusCount: statuses.length,
      dryRun,
      aligned: Boolean(cronAt && version > 0),
    },
    summary: {
      status: enabled ? "运行中" : "未接入",
      connectedSystems: dataSources.filter((d) => d.dataState === "live").length,
      ingestionPolicies: ingestionPolicies.filter((p) => p.enabled).length,
      configVersion: version > 0 ? `v${version}` : "未保存",
      lastPublishedAt:
        publishHistory[0]?.at ??
        formatRevisionAt(opts.runtimeConfig?.updatedAt ?? ""),
    },
    publishHistory,
  };
}
