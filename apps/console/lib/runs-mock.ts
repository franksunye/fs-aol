export type RunStatus = "success" | "anomaly" | "retried";

export type RunQuickFilter = "all" | RunStatus;

export type RunStep = {
  at: string;
  title: string;
  detail?: string;
};

export type RunLogLine = {
  at: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
};

export type MockRun = {
  id: string;
  agentId: string;
  agentName: string;
  triggerSource: string;
  relatedObjectId: string;
  relatedObjectType: string;
  startedAt: string;
  status: RunStatus;
  durationSec: number;
  costYuan: number;
  version: string;
  model: string;
  actionGenerated: boolean;
  actionId?: string;
  workOrderKey?: string;
  analysisRound?: number;
  steps: RunStep[];
  inputContext: { label: string; value: string }[];
  outputResult: { label: string; value: string }[];
  logs: RunLogLine[];
};

export type RunsSummary = {
  todayRuns: number;
  todayRunsDelta: number;
  success: number;
  successDelta: number;
  anomaly: number;
  anomalyDelta: number;
  avgDurationSec: number;
  avgDurationDelta: number;
};

export const RUNS_TODAY_MOCK_COUNT = 126;

export const RUN_AGENT_OPTIONS = [
  { id: "all", label: "全部 Agent" },
  { id: "follow-up", label: "Follow-up Agent" },
  { id: "estimate", label: "Estimate Agent" },
  { id: "customer-follow", label: "客户跟进 Agent" },
  { id: "contract", label: "合同管理 Agent" },
] as const;

export const RUN_STATUS_OPTIONS = [
  { id: "all", label: "全部状态" },
  { id: "success", label: "成功" },
  { id: "anomaly", label: "异常" },
  { id: "retried", label: "已重试" },
] as const;

export const RUN_MODEL_OPTIONS = [
  { id: "all", label: "全部模型" },
  { id: "claude-sonnet", label: "Claude Sonnet 3.5" },
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "heuristic", label: "Heuristic" },
] as const;

export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  success: "成功",
  anomaly: "异常",
  retried: "已重试",
};

function run(partial: MockRun): MockRun {
  return partial;
}

export function getRunsMockData(): MockRun[] {
  return [
    run({
      id: "RUN-20250609-1287",
      agentId: "follow-up",
      agentName: "Follow-up Agent",
      triggerSource: "定时扫描",
      relatedObjectId: "GD2025060764",
      relatedObjectType: "商机",
      startedAt: "06/09 13:11",
      status: "success",
      durationSec: 38.2,
      costYuan: 0.024,
      version: "v0.3.6",
      model: "claude-sonnet",
      actionGenerated: true,
      actionId: "ma-1",
      workOrderKey: "demo:sz-zhizao-001",
      analysisRound: 2,
      steps: [
        { at: "13:11:02", title: "触发运行" },
        { at: "13:11:03", title: "加载上下文", detail: "CRM · FSM · 通话记录" },
        { at: "13:11:08", title: "规则判断", detail: "报价后 48h 无跟进" },
        {
          at: "13:11:16",
          title: "LLM 推理",
          detail: "Claude Sonnet 3.5 · ~24.6s · 1,256 Tokens",
        },
        { at: "13:11:39", title: "工具调用", detail: "CRM / FSM / 通话记录" },
        { at: "13:11:40", title: "生成洞察" },
        { at: "13:11:40", title: "生成 Action", detail: "电话回访客户" },
      ],
      inputContext: [
        { label: "工单号", value: "GD2025060764" },
        { label: "报价金额", value: "¥ 128,000" },
        { label: "停滞时长", value: "6 天" },
        { label: "来源系统", value: "CRM + FSM" },
      ],
      outputResult: [
        { label: "主洞察", value: "客户已口头接受报价，需电话确认条款" },
        { label: "优先级", value: "高" },
        { label: "置信度", value: "0.86" },
        { label: "Action", value: "已生成" },
      ],
      logs: [
        { at: "13:11:02", level: "INFO", message: "Run started (scheduled_scan)" },
        { at: "13:11:03", level: "INFO", message: "Context loaded successfully (3 sources)" },
        { at: "13:11:16", level: "INFO", message: "LLM inference completed in 24.6s" },
        { at: "13:11:40", level: "INFO", message: "Action ma-1 generated" },
      ],
    }),
    run({
      id: "RUN-20250609-1286",
      agentId: "estimate",
      agentName: "Estimate Agent",
      triggerSource: "客户回复",
      relatedObjectId: "GD2025060441",
      relatedObjectType: "商机",
      startedAt: "06/09 12:48",
      status: "success",
      durationSec: 21.5,
      costYuan: 0.018,
      version: "v0.2.1",
      model: "gpt-4o",
      actionGenerated: false,
      steps: [
        { at: "12:48:01", title: "触发运行" },
        { at: "12:48:05", title: "加载上下文" },
        { at: "12:48:12", title: "LLM 推理" },
        { at: "12:48:22", title: "生成洞察" },
      ],
      inputContext: [
        { label: "工单号", value: "GD2025060441" },
        { label: "客户回复", value: "希望调整交付周期" },
      ],
      outputResult: [
        { label: "主洞察", value: "客户关注交付周期，无需立即 Action" },
        { label: "置信度", value: "0.72" },
        { label: "Action", value: "未生成" },
      ],
      logs: [
        { at: "12:48:01", level: "INFO", message: "Run started (customer_reply)" },
        { at: "12:48:22", level: "INFO", message: "No action threshold met" },
      ],
    }),
    run({
      id: "RUN-20250609-1285",
      agentId: "follow-up",
      agentName: "Follow-up Agent",
      triggerSource: "手动触发",
      relatedObjectId: "WO-88421",
      relatedObjectType: "工单",
      startedAt: "06/09 12:15",
      status: "anomaly",
      durationSec: 52.1,
      costYuan: 0.031,
      version: "v0.3.6",
      model: "claude-sonnet",
      actionGenerated: false,
      workOrderKey: "demo:wo-88421",
      steps: [
        { at: "12:15:00", title: "触发运行" },
        { at: "12:15:02", title: "加载上下文" },
        { at: "12:15:10", title: "规则判断" },
        { at: "12:15:18", title: "LLM 推理" },
        { at: "12:15:52", title: "工具调用失败", detail: "FSM 超时" },
      ],
      inputContext: [
        { label: "工单号", value: "WO-88421" },
        { label: "停滞时长", value: "11 天" },
      ],
      outputResult: [
        { label: "异常", value: "FSM 工具调用超时" },
        { label: "Action", value: "未生成" },
      ],
      logs: [
        { at: "12:15:00", level: "INFO", message: "Run started (manual)" },
        { at: "12:15:52", level: "ERROR", message: "Tool call fsm.getWorkOrder timed out" },
      ],
    }),
    run({
      id: "RUN-20250609-1284",
      agentId: "contract",
      agentName: "合同管理 Agent",
      triggerSource: "定时扫描",
      relatedObjectId: "HT2025060112",
      relatedObjectType: "合同",
      startedAt: "06/09 11:42",
      status: "success",
      durationSec: 29.8,
      costYuan: 0.019,
      version: "v0.1.8",
      model: "claude-sonnet",
      actionGenerated: true,
      actionId: "ma-2",
      steps: [
        { at: "11:42:00", title: "触发运行" },
        { at: "11:42:04", title: "加载上下文" },
        { at: "11:42:30", title: "生成 Action" },
      ],
      inputContext: [{ label: "合同号", value: "HT2025060112" }],
      outputResult: [
        { label: "主洞察", value: "法务审批停滞 3 个工作日" },
        { label: "Action", value: "已生成" },
      ],
      logs: [{ at: "11:42:30", level: "INFO", message: "Action ma-2 generated" }],
    }),
    run({
      id: "RUN-20250609-1283",
      agentId: "follow-up",
      agentName: "Follow-up Agent",
      triggerSource: "定时扫描",
      relatedObjectId: "GD2025060888",
      relatedObjectType: "合同",
      startedAt: "06/09 11:20",
      status: "retried",
      durationSec: 45.6,
      costYuan: 0.028,
      version: "v0.3.6",
      model: "claude-sonnet",
      actionGenerated: true,
      actionId: "ma-6",
      workOrderKey: "demo:yf-shiye-003",
      steps: [
        { at: "11:20:00", title: "触发运行" },
        { at: "11:20:15", title: "LLM 推理失败", detail: "首次超时" },
        { at: "11:20:35", title: "自动重试" },
        { at: "11:20:45", title: "生成 Action" },
      ],
      inputContext: [{ label: "商机", value: "云帆实业签约催办" }],
      outputResult: [{ label: "Action", value: "已生成（重试后）" }],
      logs: [
        { at: "11:20:15", level: "WARN", message: "LLM timeout, retrying..." },
        { at: "11:20:45", level: "INFO", message: "Retry succeeded" },
      ],
    }),
    run({
      id: "RUN-20250609-1282",
      agentId: "customer-follow",
      agentName: "客户跟进 Agent",
      triggerSource: "客户回复",
      relatedObjectId: "GD2025059982",
      relatedObjectType: "客户",
      startedAt: "06/09 10:55",
      status: "success",
      durationSec: 18.3,
      costYuan: 0.012,
      version: "v0.2.4",
      model: "gpt-4o",
      actionGenerated: true,
      actionId: "ma-5",
      workOrderKey: "demo:ht-lingshou-004",
      steps: [
        { at: "10:55:00", title: "触发运行" },
        { at: "10:55:18", title: "生成 Action" },
      ],
      inputContext: [{ label: "投诉单", value: "交付延迟" }],
      outputResult: [{ label: "Action", value: "投诉回访" }],
      logs: [{ at: "10:55:18", level: "INFO", message: "Action ma-5 generated" }],
    }),
    run({
      id: "RUN-20250609-1281",
      agentId: "follow-up",
      agentName: "Follow-up Agent",
      triggerSource: "定时扫描",
      relatedObjectId: "GD2025060555",
      relatedObjectType: "商机",
      startedAt: "06/09 10:30",
      status: "success",
      durationSec: 22.7,
      costYuan: 0.015,
      version: "v0.3.6",
      model: "heuristic",
      actionGenerated: true,
      actionId: "ma-7",
      steps: [
        { at: "10:30:00", title: "触发运行" },
        { at: "10:30:22", title: "生成 Action" },
      ],
      inputContext: [{ label: "报价发出", value: "46 小时前" }],
      outputResult: [{ label: "Action", value: "48h 跟进" }],
      logs: [{ at: "10:30:22", level: "INFO", message: "Heuristic path used" }],
    }),
    run({
      id: "RUN-20250609-1280",
      agentId: "follow-up",
      agentName: "Follow-up Agent",
      triggerSource: "定时扫描",
      relatedObjectId: "GD2025060333",
      relatedObjectType: "客户",
      startedAt: "06/09 09:48",
      status: "anomaly",
      durationSec: 12.4,
      costYuan: 0.008,
      version: "v0.3.6",
      model: "claude-sonnet",
      actionGenerated: false,
      steps: [
        { at: "09:48:00", title: "触发运行" },
        { at: "09:48:12", title: "上下文缺失", detail: "CRM 客户记录未找到" },
      ],
      inputContext: [{ label: "客户 ID", value: "CUS-99102" }],
      outputResult: [{ label: "异常", value: "上下文加载失败" }],
      logs: [{ at: "09:48:12", level: "ERROR", message: "CRM customer not found" }],
    }),
    run({
      id: "RUN-20250609-1279",
      agentId: "contract",
      agentName: "合同管理 Agent",
      triggerSource: "手动触发",
      relatedObjectId: "HT2025060201",
      relatedObjectType: "合同",
      startedAt: "06/09 09:12",
      status: "success",
      durationSec: 31.2,
      costYuan: 0.02,
      version: "v0.1.8",
      model: "claude-sonnet",
      actionGenerated: true,
      actionId: "ma-8",
      steps: [
        { at: "09:12:00", title: "触发运行" },
        { at: "09:12:31", title: "生成 Action" },
      ],
      inputContext: [{ label: "修订版本", value: "Rev.B" }],
      outputResult: [{ label: "Action", value: "条款修订确认" }],
      logs: [{ at: "09:12:31", level: "INFO", message: "Action ma-8 generated" }],
    }),
    run({
      id: "RUN-20250609-1278",
      agentId: "follow-up",
      agentName: "Follow-up Agent",
      triggerSource: "定时扫描",
      relatedObjectId: "GD2025060120",
      relatedObjectType: "商机",
      startedAt: "06/09 08:40",
      status: "success",
      durationSec: 19.6,
      costYuan: 0.014,
      version: "v0.3.5",
      model: "gpt-4o",
      actionGenerated: false,
      steps: [
        { at: "08:40:00", title: "触发运行" },
        { at: "08:40:19", title: "无需 Action" },
      ],
      inputContext: [{ label: "状态", value: "已签约" }],
      outputResult: [{ label: "结论", value: "无需跟进" }],
      logs: [{ at: "08:40:19", level: "INFO", message: "Skipped: already signed" }],
    }),
  ];
}

export function computeRunsSummary(runs: MockRun[]): RunsSummary {
  const success = runs.filter((r) => r.status === "success").length;
  const anomaly = runs.filter((r) => r.status === "anomaly").length;
  const avg =
    runs.length > 0
      ? runs.reduce((s, r) => s + r.durationSec, 0) / runs.length
      : 0;

  return {
    todayRuns: RUNS_TODAY_MOCK_COUNT,
    todayRunsDelta: 18,
    success,
    successDelta: 16,
    anomaly,
    anomalyDelta: 2,
    avgDurationSec: Math.round(avg * 10) / 10 || 24.3,
    avgDurationDelta: -3.1,
  };
}

export type RunsFilters = {
  quick: RunQuickFilter;
  agentId: string;
  status: string;
  model: string;
  query: string;
};

export function filterRuns(runs: MockRun[], filters: RunsFilters): MockRun[] {
  return runs.filter((item) => {
    if (filters.quick !== "all" && item.status !== filters.quick) return false;
    if (filters.agentId !== "all" && item.agentId !== filters.agentId)
      return false;
    if (filters.status !== "all" && item.status !== filters.status) return false;
    if (filters.model !== "all" && item.model !== filters.model) return false;
    const q = filters.query.trim().toLowerCase();
    if (q) {
      const hay = [
        item.id,
        item.agentName,
        item.relatedObjectId,
        item.triggerSource,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function formatDuration(sec: number): string {
  return `${sec.toFixed(1)}s`;
}

export function formatCost(yuan: number): string {
  return `¥${yuan.toFixed(3)}`;
}

export function modelLabel(modelId: string): string {
  return (
    RUN_MODEL_OPTIONS.find((o) => o.id === modelId)?.label ?? modelId
  );
}
