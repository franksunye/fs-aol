export type TaskRouteStatus = "enabled" | "grayscale" | "disabled";

export type MockTaskRoute = {
  id: string;
  task: string;
  usesLlm: boolean;
  model: string | null;
  modelTag?: string;
  outputFormat: string;
  fallback: string | null;
  status: TaskRouteStatus;
};

export type MockRuntimeConstraint = {
  id: string;
  label: string;
  enabled: boolean;
};

export type MockEvalMetric = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

export type MockModelAvailability = {
  name: string;
  available: boolean;
};

export type MockStrategyPublishRecord = {
  version: string;
  summary: string;
  at: string;
  by: string;
};

export const FOLLOW_UP_MODEL_STRATEGY_MOCK = {
  version: "v0.3.7",
  models: {
    primary: { name: "Claude Sonnet 3.5", tag: "高质量推理" },
    backup: { name: "GPT-4.1 mini" },
    vision: { name: "Gemini 2.5 Flash" },
    temperature: 0.4,
    costLimit: "¥0.80",
    timeout: "12s",
  },
  infraNote:
    "模型来源于 AI 基础设施统一接入，本页仅配置 Follow-up Agent 的使用策略。",
  taskRoutes: [
    {
      id: "rule-screen",
      task: "规则筛查",
      usesLlm: false,
      model: null,
      outputFormat: "规则命中",
      fallback: null,
      status: "enabled",
    },
    {
      id: "fact-summary",
      task: "事实摘要",
      usesLlm: true,
      model: "Claude Sonnet 3.5",
      outputFormat: "摘要文本",
      fallback: "GPT-4.1 mini",
      status: "enabled",
    },
    {
      id: "follow-up-gen",
      task: "跟进建议生成",
      usesLlm: true,
      model: "Claude Sonnet 3.5",
      modelTag: "Action Spec",
      outputFormat: "JSON",
      fallback: "GPT-4.1 mini",
      status: "enabled",
    },
    {
      id: "intent-understand",
      task: "客户意图理解",
      usesLlm: true,
      model: "Gemini 2.5 Flash",
      outputFormat: "分类标签",
      fallback: "GPT-4.1 mini",
      status: "grayscale",
    },
  ] satisfies MockTaskRoute[],
  constraints: [
    { id: "structured", label: "结构化输出", enabled: true },
    { id: "tools", label: "工具调用", enabled: true },
    { id: "vision", label: "允许视觉输入", enabled: true },
    { id: "long-context", label: "长上下文", enabled: false },
    { id: "retry", label: "失败自动重试", enabled: true },
    { id: "peak-downgrade", label: "高峰降模", enabled: true },
    { id: "human-writeback", label: "人工审批后写回 CRM", enabled: true },
    { id: "audit", label: "审计日志", enabled: true },
  ] satisfies MockRuntimeConstraint[],
  prompt: {
    version: "v1.3",
    summary:
      "结合停滞天数、报价状态与客户情绪，生成可执行的跟进建议与话术要点；输出遵循 Action Spec 契约。",
  },
  metrics: [
    { id: "success", label: "成功率", value: "96.4%" },
    { id: "latency", label: "平均延迟", value: "4.8s" },
    { id: "cost", label: "平均成本", value: "¥0.19" },
    { id: "runs", label: "周运行", value: "328" },
  ] satisfies MockEvalMetric[],
  summary: {
    primaryModel: "Claude Sonnet 3.5",
    backupModel: "GPT-4.1 mini",
    version: "v0.3.7",
    lastPublishedAt: "2026-06-04 09:10",
    publisher: "张俊",
  },
  availability: [
    { name: "Claude Sonnet 3.5", available: true },
    { name: "GPT-4.1 mini", available: true },
    { name: "Gemini 2.5 Flash", available: true },
    { name: "DeepSeek Chat", available: true },
  ] satisfies MockModelAvailability[],
  publishHistory: [
    {
      version: "v0.3.7",
      summary: "跟进建议生成切换至 Claude Sonnet 3.5",
      at: "2026-06-04 09:10",
      by: "张俊",
    },
    {
      version: "v0.3.6",
      summary: "新增客户意图理解灰度路由",
      at: "2026-06-03 18:20",
      by: "张俊",
    },
    {
      version: "v0.3.5",
      summary: "备份模型统一为 GPT-4.1 mini",
      at: "2026-05-28 11:05",
      by: "李管家",
    },
  ] satisfies MockStrategyPublishRecord[],
  testTasks: [
    { id: "follow-up-gen", label: "跟进建议生成" },
    { id: "fact-summary", label: "事实摘要" },
    { id: "intent-understand", label: "客户意图理解" },
  ],
  testVersions: ["v0.3.7（当前草稿）", "v0.3.6（生产）", "v0.3.5"],
  lastTestRun: {
    workOrderId: "WO-2026-0412",
    task: "跟进建议生成",
    version: "v0.3.7（当前草稿）",
    at: "刚刚",
    duration: "4.6s",
    model: "Claude Sonnet 3.5",
    outcome: "成功",
    summary:
      "识别待签约停滞，建议电话回访确认报价；已生成 Action Spec 与话术要点。",
  },
};

export const TASK_ROUTE_STATUS_LABEL: Record<TaskRouteStatus, string> = {
  enabled: "启用",
  grayscale: "灰度",
  disabled: "停用",
};

export function taskRouteStatusClass(status: TaskRouteStatus): string {
  if (status === "enabled") return "bg-emerald-500/10 text-emerald-700";
  if (status === "grayscale") return "bg-amber-500/10 text-amber-700";
  return "bg-muted text-muted-foreground";
}
