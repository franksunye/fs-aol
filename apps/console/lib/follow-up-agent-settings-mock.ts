export type TriggerPriority = "P0" | "P1" | "P2";

export type MockTriggerRule = {
  id: string;
  name: string;
  mode: string;
  condition: string;
  priority: TriggerPriority;
  enabled: boolean;
};

export type MockDataSource = {
  id: string;
  name: string;
  permissions: ("读" | "写")[];
};

export type MockPublishRecord = {
  version: string;
  summary: string;
  at: string;
};

export type MockTestRun = {
  workOrderId: string;
  at: string;
  outcome: string;
};

export const FOLLOW_UP_SETTINGS_MOCK = {
  version: "v0.3.6",
  basic: {
    name: "Follow-up Agent",
    owner: "张俊",
    businessStage: "报价后跟进 / 回款推动",
    enabled: true,
    description:
      "聚焦待签约阶段，识别停滞商机并生成跟进建议，帮助管家推动签约与回款。",
    serviceLines: ["Revenue 服务线"],
  },
  triggerRules: [
    {
      id: "quoted-unsigned",
      name: "已正式报价未签约",
      mode: "事件触发",
      condition: "报价状态 = 正式报价 且 未签约",
      priority: "P0",
      enabled: true,
    },
    {
      id: "stale-threshold",
      name: "停滞超过阈值",
      mode: "定时扫描",
      condition: "停滞天数 ≥ 1 天",
      priority: "P1",
      enabled: true,
    },
    {
      id: "high-priority-opp",
      name: "高优先级商机",
      mode: "组合规则",
      condition: "金额 ≥ ¥3000 且 停滞 ≥ 1 天",
      priority: "P0",
      enabled: true,
    },
    {
      id: "no-followup-after-quote",
      name: "报价后无跟进",
      mode: "事件触发",
      condition: "报价后 48h 无通话 / 企微记录",
      priority: "P2",
      enabled: true,
    },
  ] satisfies MockTriggerRule[],
  dataSources: [
    { id: "work-order", name: "工单", permissions: ["读"] },
    { id: "quote", name: "报价", permissions: ["读"] },
    { id: "customer", name: "客户", permissions: ["读"] },
    { id: "call-log", name: "通话记录", permissions: ["读"] },
    { id: "wecom", name: "企微消息", permissions: ["读"] },
    { id: "crm-opp", name: "CRM 商机", permissions: ["读", "写"] },
  ] satisfies MockDataSource[],
  actions: {
    auto: ["生成建议", "推送提醒", "标注优先级", "汇总证据"],
    manual: ["创建任务", "更新商机阶段", "修改报价方案", "发送客户消息"],
  },
  prompt: {
    strategyName: "跟进建议（停滞+报价）策略",
    strategyVersion: "v1.2",
    strategyHint: "结合停滞天数、报价状态与客户情绪生成下一步动作",
    knowledgeBases: ["产品知识库", "销售话术库", "报价规则库", "城市服务政策"],
  },
  notifications: {
    channels: [
      { id: "inbox", label: "收件箱", hint: "管家待办" },
      { id: "wecom", label: "企微", hint: "应用消息" },
      { id: "email", label: "邮件", hint: "摘要抄送" },
    ],
    frequency: "实时",
    writeBack: "仅建议，不自动写回",
    quietHours: "22:00 – 08:00",
  },
  summary: {
    status: "已启用",
    connectedSystems: 5,
    triggerRules: 4,
    autoActions: 4,
    approvalActions: 4,
    lastPublishedAt: "2026-06-03 18:20",
    version: "v0.3.6",
  },
  publishHistory: [
    {
      version: "v0.3.6",
      summary: "新增「报价后无跟进」规则，优化 P0 优先级判定",
      at: "2026-06-03 18:20",
    },
    {
      version: "v0.3.5",
      summary: "接入企微消息数据源，补充证据引用",
      at: "2026-05-28 11:05",
    },
    {
      version: "v0.3.4",
      summary: "调整停滞阈值为 1 天，更新 Prompt 策略 v1.2",
      at: "2026-05-21 09:40",
    },
  ] satisfies MockPublishRecord[],
  lastTestRun: {
    workOrderId: "WO-2026-0412",
    at: "今天 10:24",
    outcome: "生成跟进建议 · 建议已推送管家",
  } satisfies MockTestRun,
};

export const TRIGGER_PRIORITY_LABEL: Record<
  TriggerPriority,
  { label: string; className: string }
> = {
  P0: { label: "P0", className: "bg-red-500/10 text-red-700" },
  P1: { label: "P1", className: "bg-amber-500/10 text-amber-700" },
  P2: { label: "P2", className: "bg-emerald-500/10 text-emerald-700" },
};
