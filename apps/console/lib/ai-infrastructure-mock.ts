export type ProviderConnectionStatus = "connected" | "abnormal" | "draft";
export type ProviderFilterTab = "all" | ProviderConnectionStatus;

export type MockLlmModel = {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  defaultUsage: string;
  latency: string;
  cost: string;
  available: boolean;
};

export type MockRoutingStrategy = {
  defaultGeneration: string;
  defaultReasoning: string;
  defaultVision: string;
  fallbackModel: string;
  productionAllowed: string[];
};

export type MockProviderHealth = {
  availability: string;
  availabilityTone: "good" | "warn";
  latency: string;
  errorRate: string;
  quotaUsedPercent: number;
};

export type MockSecurityGovernance = {
  dataRetention: string;
  piiMasking: string;
  auditLogs: string;
  accessControl: string;
};

export type MockProviderEvent = {
  id: string;
  at: string;
  title: string;
  tag: string;
  tagTone: "success" | "danger" | "info" | "warn";
};

export type MockLlmProvider = {
  id: string;
  name: string;
  shortLabel: string;
  brandClassName: string;
  status: ProviderConnectionStatus;
  environment: "Production" | "Staging";
  lastSync: string;
  endpoint: string;
  region: string;
  lastCheck: string;
  syncLabel: string;
  syncTone: "good" | "warn" | "muted";
  models: MockLlmModel[];
  routing: MockRoutingStrategy;
  health: MockProviderHealth;
  security: MockSecurityGovernance;
  events: MockProviderEvent[];
};

export const AI_INFRA_SUMMARY = {
  connectedProviders: 5,
  availableModels: 18,
  requestsToday: 12_430,
  costToday: 486.2,
} as const;

export const PROVIDER_STATUS_LABEL: Record<ProviderConnectionStatus, string> = {
  connected: "已连接",
  abnormal: "异常",
  draft: "草稿",
};

export const PROVIDER_FILTER_TABS: { id: ProviderFilterTab; label: string }[] =
  [
    { id: "all", label: "全部" },
    { id: "connected", label: "已连接" },
    { id: "abnormal", label: "异常" },
    { id: "draft", label: "草稿" },
  ];

const OPENAI_MODELS: MockLlmModel[] = [
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    type: "聊天模型",
    capabilities: ["文本", "视觉", "工具调用"],
    defaultUsage: "高质量推理",
    latency: "2.1s",
    cost: "¥0.12 / 1K",
    available: true,
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 mini",
    type: "聊天模型",
    capabilities: ["文本", "工具调用"],
    defaultUsage: "通用生成",
    latency: "0.9s",
    cost: "¥0.03 / 1K",
    available: true,
  },
  {
    id: "o4-mini",
    name: "o4-mini",
    type: "推理模型",
    capabilities: ["文本", "推理"],
    defaultUsage: "复杂分析",
    latency: "3.4s",
    cost: "¥0.08 / 1K",
    available: true,
  },
];

export const MOCK_LLM_PROVIDERS: MockLlmProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    shortLabel: "OA",
    brandClassName: "bg-emerald-500/10 text-emerald-700",
    status: "connected",
    environment: "Production",
    lastSync: "2 分钟前",
    endpoint: "https://api.openai.com/v1",
    region: "Global",
    lastCheck: "今天 11:02",
    syncLabel: "同步正常",
    syncTone: "good",
    models: OPENAI_MODELS,
    routing: {
      defaultGeneration: "GPT-4.1 mini",
      defaultReasoning: "GPT-4.1",
      defaultVision: "GPT-4.1",
      fallbackModel: "DeepSeek Chat",
      productionAllowed: ["GPT-4.1", "GPT-4.1 mini", "o4-mini"],
    },
    health: {
      availability: "99%",
      availabilityTone: "good",
      latency: "1.2s",
      errorRate: "0.4%",
      quotaUsedPercent: 48,
    },
    security: {
      dataRetention: "关闭",
      piiMasking: "已启用",
      auditLogs: "已启用",
      accessControl: "按角色限制",
    },
    events: [
      {
        id: "openai-1",
        at: "今天 10:18",
        title: "OpenAI 密钥轮换成功",
        tag: "安全",
        tagTone: "success",
      },
      {
        id: "openai-2",
        at: "今天 09:40",
        title: "GPT-4.1 mini 延迟恢复正常",
        tag: "恢复",
        tagTone: "info",
      },
      {
        id: "openai-3",
        at: "昨天 17:05",
        title: "生产路由策略更新为 v0.3.6",
        tag: "配置",
        tagTone: "info",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    shortLabel: "AN",
    brandClassName: "bg-amber-500/10 text-amber-800",
    status: "connected",
    environment: "Production",
    lastSync: "5 分钟前",
    endpoint: "https://api.anthropic.com",
    region: "Global",
    lastCheck: "今天 10:58",
    syncLabel: "同步正常",
    syncTone: "good",
    models: [
      {
        id: "claude-sonnet",
        name: "Claude Sonnet 3.5",
        type: "聊天模型",
        capabilities: ["文本", "视觉", "工具调用"],
        defaultUsage: "高质量推理",
        latency: "2.4s",
        cost: "¥0.15 / 1K",
        available: true,
      },
      {
        id: "claude-haiku",
        name: "Claude Haiku 3.5",
        type: "聊天模型",
        capabilities: ["文本", "工具调用"],
        defaultUsage: "快速响应",
        latency: "0.8s",
        cost: "¥0.02 / 1K",
        available: true,
      },
    ],
    routing: {
      defaultGeneration: "Claude Haiku 3.5",
      defaultReasoning: "Claude Sonnet 3.5",
      defaultVision: "Claude Sonnet 3.5",
      fallbackModel: "GPT-4.1 mini",
      productionAllowed: ["Claude Sonnet 3.5", "Claude Haiku 3.5"],
    },
    health: {
      availability: "99.2%",
      availabilityTone: "good",
      latency: "1.4s",
      errorRate: "0.3%",
      quotaUsedPercent: 36,
    },
    security: {
      dataRetention: "关闭",
      piiMasking: "已启用",
      auditLogs: "已启用",
      accessControl: "按角色限制",
    },
    events: [
      {
        id: "anthropic-1",
        at: "今天 08:12",
        title: "Claude Sonnet 配额提升至 80%",
        tag: "配额",
        tagTone: "info",
      },
    ],
  },
  {
    id: "google-gemini",
    name: "Google Gemini",
    shortLabel: "GM",
    brandClassName: "bg-sky-500/10 text-sky-700",
    status: "connected",
    environment: "Staging",
    lastSync: "12 分钟前",
    endpoint: "https://generativelanguage.googleapis.com",
    region: "Global",
    lastCheck: "今天 10:50",
    syncLabel: "同步正常",
    syncTone: "good",
    models: [
      {
        id: "gemini-flash",
        name: "Gemini 2.5 Flash",
        type: "多模态模型",
        capabilities: ["文本", "视觉", "工具调用"],
        defaultUsage: "视觉理解",
        latency: "1.1s",
        cost: "¥0.04 / 1K",
        available: true,
      },
    ],
    routing: {
      defaultGeneration: "Gemini 2.5 Flash",
      defaultReasoning: "Gemini 2.5 Flash",
      defaultVision: "Gemini 2.5 Flash",
      fallbackModel: "GPT-4.1 mini",
      productionAllowed: ["Gemini 2.5 Flash"],
    },
    health: {
      availability: "98.6%",
      availabilityTone: "good",
      latency: "1.0s",
      errorRate: "0.6%",
      quotaUsedPercent: 22,
    },
    security: {
      dataRetention: "关闭",
      piiMasking: "已启用",
      auditLogs: "已启用",
      accessControl: "Staging 专用",
    },
    events: [
      {
        id: "gemini-1",
        at: "昨天 14:20",
        title: "Staging 环境接入 Gemini 2.5 Flash",
        tag: "接入",
        tagTone: "success",
      },
    ],
  },
  {
    id: "azure-openai",
    name: "Azure OpenAI",
    shortLabel: "AZ",
    brandClassName: "bg-blue-500/10 text-blue-700",
    status: "abnormal",
    environment: "Production",
    lastSync: "35 分钟前",
    endpoint: "https://fs-aol.openai.azure.com",
    region: "China East",
    lastCheck: "今天 10:30",
    syncLabel: "连接异常",
    syncTone: "warn",
    models: [
      {
        id: "gpt-4o-azure",
        name: "GPT-4o (Azure)",
        type: "聊天模型",
        capabilities: ["文本", "视觉"],
        defaultUsage: "企业合规推理",
        latency: "—",
        cost: "¥0.14 / 1K",
        available: false,
      },
    ],
    routing: {
      defaultGeneration: "GPT-4o (Azure)",
      defaultReasoning: "GPT-4o (Azure)",
      defaultVision: "GPT-4o (Azure)",
      fallbackModel: "GPT-4.1 mini",
      productionAllowed: ["GPT-4o (Azure)"],
    },
    health: {
      availability: "91%",
      availabilityTone: "warn",
      latency: "—",
      errorRate: "4.8%",
      quotaUsedPercent: 12,
    },
    security: {
      dataRetention: "30 天",
      piiMasking: "已启用",
      auditLogs: "已启用",
      accessControl: "企业租户隔离",
    },
    events: [
      {
        id: "azure-1",
        at: "今天 10:12",
        title: "Azure OpenAI 连接测试失败",
        tag: "异常",
        tagTone: "danger",
      },
      {
        id: "azure-2",
        at: "今天 09:55",
        title: "已自动切换至 OpenAI 直连回退",
        tag: "回退",
        tagTone: "warn",
      },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    shortLabel: "DS",
    brandClassName: "bg-violet-500/10 text-violet-700",
    status: "connected",
    environment: "Staging",
    lastSync: "8 分钟前",
    endpoint: "https://api.deepseek.com",
    region: "Global",
    lastCheck: "今天 10:56",
    syncLabel: "同步正常",
    syncTone: "good",
    models: [
      {
        id: "deepseek-chat",
        name: "DeepSeek Chat",
        type: "聊天模型",
        capabilities: ["文本", "工具调用"],
        defaultUsage: "成本优化生成",
        latency: "1.3s",
        cost: "¥0.01 / 1K",
        available: true,
      },
    ],
    routing: {
      defaultGeneration: "DeepSeek Chat",
      defaultReasoning: "DeepSeek Chat",
      defaultVision: "Gemini 2.5 Flash",
      fallbackModel: "GPT-4.1 mini",
      productionAllowed: ["DeepSeek Chat"],
    },
    health: {
      availability: "98.9%",
      availabilityTone: "good",
      latency: "1.3s",
      errorRate: "0.5%",
      quotaUsedPercent: 18,
    },
    security: {
      dataRetention: "关闭",
      piiMasking: "已启用",
      auditLogs: "已启用",
      accessControl: "Staging 专用",
    },
    events: [
      {
        id: "deepseek-1",
        at: "昨天 11:30",
        title: "DeepSeek 连接测试失败（已恢复）",
        tag: "恢复",
        tagTone: "info",
      },
    ],
  },
];

export function filterProviders(
  providers: MockLlmProvider[],
  opts: { tab: ProviderFilterTab; query: string }
): MockLlmProvider[] {
  const q = opts.query.trim().toLowerCase();
  return providers.filter((provider) => {
    if (opts.tab !== "all" && provider.status !== opts.tab) return false;
    if (q && !provider.name.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function eventTagClass(tone: MockProviderEvent["tagTone"]): string {
  switch (tone) {
    case "success":
      return "bg-emerald-500/10 text-emerald-700";
    case "danger":
      return "bg-red-500/10 text-red-700";
    case "warn":
      return "bg-amber-500/10 text-amber-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}
