export type IntegrationStatus = "connected" | "pending" | "draft" | "abnormal";
export type IntegrationCategory = "crm" | "fsm" | "communication" | "internal";
export type IntegrationFilterTab = "all" | IntegrationCategory;

export type MockObjectMapping = {
  id: string;
  externalObject: string;
  internalObject: string;
  mappedFields: string;
  writeBack: string;
  status: "正常" | "待配置" | "异常";
};

export type MockIntegrationEvent = {
  id: string;
  at: string;
  title: string;
  tag: string;
  tagTone: "success" | "danger" | "info" | "warn";
};

export type MockIntegration = {
  id: string;
  name: string;
  shortLabel: string;
  brandClassName: string;
  category: IntegrationCategory;
  categoryLabel: string;
  status: IntegrationStatus;
  environment: "Production" | "Staging";
  version: string;
  lastActivity: string;
  endpoint?: string;
  authStatus: string;
  lastSync: string;
  syncFrequency: string;
  dataDirection: string;
  supportedObjects: { name: string; sync: string }[];
  mappings: MockObjectMapping[];
  triggerEvents: string[];
  permissions: {
    readOnly: string[];
    writable: string[];
  };
  health: {
    dataSync: string;
    auth: string;
    apiResponse: string;
    writeBackSuccess: string;
    errorRate24h: string;
  };
  syncSettings: {
    mode: string;
    retry: string;
    timezone: string;
  };
  events: MockIntegrationEvent[];
};

export const INTEGRATIONS_SUMMARY = {
  connectedSystems: 6,
  healthySync: 5,
  pendingConfig: 2,
  eventsToday: 2_341,
} as const;

export const INTEGRATION_STATUS_LABEL: Record<IntegrationStatus, string> = {
  connected: "已连接",
  pending: "待配置",
  draft: "草稿",
  abnormal: "异常",
};

export const INTEGRATION_FILTER_TABS: {
  id: IntegrationFilterTab;
  label: string;
}[] = [
  { id: "all", label: "全部" },
  { id: "crm", label: "CRM" },
  { id: "fsm", label: "FSM" },
  { id: "communication", label: "沟通" },
  { id: "internal", label: "内部系统" },
];

export const INTEGRATION_SORT_OPTIONS = [
  { id: "status", label: "按状态" },
  { id: "name", label: "按名称" },
  { id: "activity", label: "按最近活动" },
] as const;

export type IntegrationSortKey = (typeof INTEGRATION_SORT_OPTIONS)[number]["id"];

const CRM_SELF: MockIntegration = {
  id: "crm-self",
  name: "自研 CRM",
  shortLabel: "CRM",
  brandClassName: "bg-primary/10 text-primary",
  category: "crm",
  categoryLabel: "CRM",
  status: "connected",
  environment: "Production",
  version: "v2.1.3",
  lastActivity: "5 分钟前",
  endpoint: "https://crm.internal.fs-aol/api",
  authStatus: "已授权",
  lastSync: "今天 11:08",
  syncFrequency: "每 5 分钟",
  dataDirection: "读 / 写",
  supportedObjects: [
    { name: "客户", sync: "双向同步" },
    { name: "商机", sync: "双向同步" },
    { name: "报价", sync: "读 + 写回" },
    { name: "预约", sync: "只读" },
  ],
  mappings: [
    {
      id: "customer",
      externalObject: "Customer",
      internalObject: "客户",
      mappedFields: "28 / 34",
      writeBack: "允许",
      status: "正常",
    },
    {
      id: "opportunity",
      externalObject: "Opportunity",
      internalObject: "商机",
      mappedFields: "22 / 26",
      writeBack: "允许",
      status: "正常",
    },
    {
      id: "quote",
      externalObject: "Quote",
      internalObject: "报价",
      mappedFields: "18 / 24",
      writeBack: "审批后",
      status: "正常",
    },
    {
      id: "appointment",
      externalObject: "Appointment",
      internalObject: "预约",
      mappedFields: "12 / 12",
      writeBack: "禁止",
      status: "正常",
    },
  ],
  triggerEvents: [
    "报价创建",
    "商机阶段变更",
    "通话结束",
    "工单状态更新",
    "客户标签变更",
  ],
  permissions: {
    readOnly: ["预约", "历史通话摘要"],
    writable: ["商机阶段", "跟进备注", "报价状态"],
  },
  health: {
    dataSync: "正常",
    auth: "正常",
    apiResponse: "正常",
    writeBackSuccess: "98.6%",
    errorRate24h: "0.3%",
  },
  syncSettings: {
    mode: "增量同步",
    retry: "3 次",
    timezone: "UTC+08:00",
  },
  events: [
    {
      id: "crm-1",
      at: "今天 11:05",
      title: "客户同步成功 · 128 条",
      tag: "同步",
      tagTone: "success",
    },
    {
      id: "crm-2",
      at: "今天 10:42",
      title: "报价创建写回成功 · WO-2026-0412",
      tag: "写回",
      tagTone: "success",
    },
    {
      id: "crm-3",
      at: "今天 09:18",
      title: "商机阶段变更事件已投递",
      tag: "事件",
      tagTone: "info",
    },
  ],
};

export const MOCK_INTEGRATIONS: MockIntegration[] = [
  CRM_SELF,
  {
    id: "fsm-core",
    name: "FSM 工单系统",
    shortLabel: "FSM",
    brandClassName: "bg-sky-500/10 text-sky-700",
    category: "fsm",
    categoryLabel: "FSM",
    status: "connected",
    environment: "Production",
    version: "v1.8.0",
    lastActivity: "8 分钟前",
    authStatus: "已授权",
    lastSync: "今天 11:00",
    syncFrequency: "每 10 分钟",
    dataDirection: "读 / 写",
    supportedObjects: [
      { name: "工单", sync: "双向同步" },
      { name: "上门任务", sync: "读 + 写回" },
    ],
    mappings: [
      {
        id: "work-order",
        externalObject: "WorkOrder",
        internalObject: "工单",
        mappedFields: "31 / 36",
        writeBack: "允许",
        status: "正常",
      },
    ],
    triggerEvents: ["工单创建", "上门完成", "停滞超时"],
    permissions: {
      readOnly: ["工单历史"],
      writable: ["工单状态", "上门备注"],
    },
    health: {
      dataSync: "正常",
      auth: "正常",
      apiResponse: "正常",
      writeBackSuccess: "97.2%",
      errorRate24h: "0.5%",
    },
    syncSettings: {
      mode: "增量同步",
      retry: "3 次",
      timezone: "UTC+08:00",
    },
    events: [
      {
        id: "fsm-1",
        at: "今天 10:55",
        title: "工单同步成功 · 56 条",
        tag: "同步",
        tagTone: "success",
      },
    ],
  },
  {
    id: "wecom",
    name: "企业微信",
    shortLabel: "企微",
    brandClassName: "bg-emerald-500/10 text-emerald-700",
    category: "communication",
    categoryLabel: "沟通",
    status: "connected",
    environment: "Production",
    version: "v3.0.1",
    lastActivity: "12 分钟前",
    authStatus: "已授权",
    lastSync: "今天 10:56",
    syncFrequency: "实时",
    dataDirection: "读",
    supportedObjects: [
      { name: "应用消息", sync: "推送" },
      { name: "客户会话", sync: "只读" },
    ],
    mappings: [],
    triggerEvents: ["消息送达", "客户回复"],
    permissions: {
      readOnly: ["客户会话", "消息记录"],
      writable: ["应用消息推送"],
    },
    health: {
      dataSync: "正常",
      auth: "正常",
      apiResponse: "正常",
      writeBackSuccess: "99.1%",
      errorRate24h: "0.1%",
    },
    syncSettings: {
      mode: "事件驱动",
      retry: "5 次",
      timezone: "UTC+08:00",
    },
    events: [
      {
        id: "wecom-1",
        at: "今天 10:30",
        title: "管家提醒推送成功",
        tag: "推送",
        tagTone: "success",
      },
    ],
  },
  {
    id: "call-center",
    name: "通话中心",
    shortLabel: "通话",
    brandClassName: "bg-violet-500/10 text-violet-700",
    category: "communication",
    categoryLabel: "沟通",
    status: "pending",
    environment: "Staging",
    version: "v0.9.2",
    lastActivity: "1 小时前",
    authStatus: "待授权",
    lastSync: "—",
    syncFrequency: "—",
    dataDirection: "读",
    supportedObjects: [{ name: "通话记录", sync: "只读" }],
    mappings: [
      {
        id: "call-log",
        externalObject: "CallLog",
        internalObject: "通话记录",
        mappedFields: "8 / 14",
        writeBack: "禁止",
        status: "待配置",
      },
    ],
    triggerEvents: ["通话结束"],
    permissions: {
      readOnly: ["通话记录", "录音摘要"],
      writable: [],
    },
    health: {
      dataSync: "待配置",
      auth: "待授权",
      apiResponse: "—",
      writeBackSuccess: "—",
      errorRate24h: "—",
    },
    syncSettings: {
      mode: "—",
      retry: "—",
      timezone: "UTC+08:00",
    },
    events: [
      {
        id: "call-1",
        at: "今天 09:00",
        title: "连接配置待完成",
        tag: "待配置",
        tagTone: "warn",
      },
    ],
  },
  {
    id: "erp-lite",
    name: "ERP -lite",
    shortLabel: "ERP",
    brandClassName: "bg-amber-500/10 text-amber-800",
    category: "internal",
    categoryLabel: "内部系统",
    status: "draft",
    environment: "Staging",
    version: "v0.1.0",
    lastActivity: "昨天",
    authStatus: "未配置",
    lastSync: "—",
    syncFrequency: "—",
    dataDirection: "读",
    supportedObjects: [],
    mappings: [],
    triggerEvents: [],
    permissions: { readOnly: [], writable: [] },
    health: {
      dataSync: "—",
      auth: "—",
      apiResponse: "—",
      writeBackSuccess: "—",
      errorRate24h: "—",
    },
    syncSettings: { mode: "—", retry: "—", timezone: "UTC+08:00" },
    events: [],
  },
  {
    id: "sms-gateway",
    name: "短信网关",
    shortLabel: "短信",
    brandClassName: "bg-rose-500/10 text-rose-700",
    category: "communication",
    categoryLabel: "沟通",
    status: "abnormal",
    environment: "Production",
    version: "v1.2.0",
    lastActivity: "25 分钟前",
    authStatus: "已授权",
    lastSync: "今天 10:40",
    syncFrequency: "实时",
    dataDirection: "写",
    supportedObjects: [{ name: "短信通知", sync: "推送" }],
    mappings: [],
    triggerEvents: ["短信发送"],
    permissions: {
      readOnly: [],
      writable: ["短信通知"],
    },
    health: {
      dataSync: "异常",
      auth: "正常",
      apiResponse: "超时",
      writeBackSuccess: "82.4%",
      errorRate24h: "3.2%",
    },
    syncSettings: {
      mode: "事件驱动",
      retry: "2 次",
      timezone: "UTC+08:00",
    },
    events: [
      {
        id: "sms-1",
        at: "今天 10:38",
        title: "短信网关 API 超时",
        tag: "异常",
        tagTone: "danger",
      },
    ],
  },
];

export function filterIntegrations(
  integrations: MockIntegration[],
  opts: { tab: IntegrationFilterTab; query: string }
): MockIntegration[] {
  const q = opts.query.trim().toLowerCase();
  return integrations.filter((item) => {
    if (opts.tab !== "all" && item.category !== opts.tab) return false;
    if (q && !item.name.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function sortIntegrations(
  integrations: MockIntegration[],
  sortKey: IntegrationSortKey
): MockIntegration[] {
  const statusRank: Record<IntegrationStatus, number> = {
    connected: 0,
    pending: 1,
    abnormal: 2,
    draft: 3,
  };
  const next = [...integrations];
  next.sort((a, b) => {
    if (sortKey === "name") {
      return a.name.localeCompare(b.name, "zh-CN");
    }
    if (sortKey === "activity") {
      return a.lastActivity.localeCompare(b.lastActivity, "zh-CN");
    }
    return statusRank[a.status] - statusRank[b.status];
  });
  return next;
}

export function integrationStatusClass(status: IntegrationStatus): string {
  switch (status) {
    case "connected":
      return "bg-emerald-500/10 text-emerald-700";
    case "pending":
      return "bg-amber-500/10 text-amber-700";
    case "abnormal":
      return "bg-red-500/10 text-red-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function integrationEventTagClass(
  tone: MockIntegrationEvent["tagTone"]
): string {
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

export function mappingStatusClass(status: MockObjectMapping["status"]): string {
  switch (status) {
    case "正常":
      return "text-emerald-600";
    case "待配置":
      return "text-amber-700";
    default:
      return "text-red-600";
  }
}

/** Follow-up Agent 数据来源 id → 集成页深链 */
export const AGENT_DATA_SOURCE_INTEGRATION: Record<string, string> = {
  "work-order": "xlink-fsm",
  quote: "crm-self",
  customer: "crm-self",
  "call-log": "call-center",
  wecom: "wecom",
  "crm-opp": "crm-self",
};
