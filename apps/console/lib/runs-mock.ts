import { FOLLOW_UP_SKILL, skillSourceAgent } from "./skills";

const FOLLOW_UP_AGENT_ID = FOLLOW_UP_SKILL.id;
const FOLLOW_UP_AGENT_NAME = FOLLOW_UP_SKILL.productName;

export type RunStatus = "success" | "anomaly" | "retried";

export type RunQuickFilter = "all" | RunStatus;

export type PipelineStageId =
  | "trigger"
  | "input"
  | "rules"
  | "llm"
  | "tools"
  | "output"
  | "action";

export type PipelineStageStatus = "ok" | "skip" | "fail" | "warn";

export type PipelineStage = {
  id: PipelineStageId;
  at: string;
  status: PipelineStageStatus;
  headline: string;
  kv?: { label: string; value: string }[];
  bullets?: string[];
  code?: string;
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
  /** Numeric aol_actions.id for execution tab deep link */
  actionDbId?: number;
  workOrderKey?: string;
  analysisRound?: number;
  errorCount: number;
  retryCount: number;
  errorSummary?: string;
  pipeline: PipelineStage[];
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

export const PIPELINE_STAGE_LABELS: Record<PipelineStageId, string> = {
  trigger: "Trigger 触发",
  input: "输入快照",
  rules: "规则判断",
  llm: "LLM 调用",
  tools: "工具调用",
  output: "输出结果",
  action: "生成 Action",
};

export const RUNS_TODAY_MOCK_COUNT = 126;

export const RUN_AGENT_OPTIONS = [
  { id: "all", label: "全部 Agent" },
  skillSourceAgent(FOLLOW_UP_SKILL.id),
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
      agentId: FOLLOW_UP_AGENT_ID,
      agentName: FOLLOW_UP_AGENT_NAME,
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
      errorCount: 0,
      retryCount: 0,
      pipeline: [
        {
          id: "trigger",
          at: "13:11:02",
          status: "ok",
          headline: "定时扫描触发",
          kv: [
            { label: "触发类型", value: "scheduled_scan" },
            { label: "调度批次", value: "batch-20250609-13" },
            { label: "Agent 版本", value: "v0.3.6" },
          ],
        },
        {
          id: "input",
          at: "13:11:03",
          status: "ok",
          headline: "上下文快照已加载",
          kv: [
            { label: "工单号", value: "GD2025060764" },
            { label: "报价金额", value: "¥ 128,000" },
            { label: "停滞时长", value: "6 天" },
            { label: "来源系统", value: "CRM + FSM + 通话记录" },
          ],
        },
        {
          id: "rules",
          at: "13:11:08",
          status: "ok",
          headline: "命中跟进规则",
          bullets: [
            "报价后 48h 无跟进 → 命中",
            "商机阶段 = 报价确认 → 命中",
            "客户活跃度 ≥ 中 → 命中",
          ],
        },
        {
          id: "llm",
          at: "13:11:16",
          status: "ok",
          headline: "Claude Sonnet 3.5 推理完成",
          kv: [
            { label: "模型", value: "Claude Sonnet 3.5" },
            { label: "Tokens", value: "842 in / 414 out" },
            { label: "耗时", value: "24.6s" },
            { label: "成本", value: "¥0.018" },
          ],
        },
        {
          id: "tools",
          at: "13:11:39",
          status: "ok",
          headline: "3 次工具调用成功",
          code: `crm.getOpportunity("GD2025060764") → 200 OK\nfsm.getWorkOrder("WO-77201") → 200 OK\ntelephony.getRecentCalls(7d) → 200 OK (3 records)`,
        },
        {
          id: "output",
          at: "13:11:40",
          status: "ok",
          headline: "洞察输出",
          kv: [
            { label: "主洞察", value: "客户已口头接受报价，需电话确认条款" },
            { label: "优先级", value: "高" },
            { label: "置信度", value: "0.86" },
          ],
        },
        {
          id: "action",
          at: "13:11:40",
          status: "ok",
          headline: "Action 已生成",
          kv: [
            { label: "Action ID", value: "ma-1" },
            { label: "类型", value: "电话回访客户" },
            { label: "截止", value: "今日 18:00" },
          ],
        },
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
      errorCount: 0,
      retryCount: 0,
      pipeline: [
        {
          id: "trigger",
          at: "12:48:01",
          status: "ok",
          headline: "客户回复触发",
          kv: [
            { label: "触发类型", value: "customer_reply" },
            { label: "渠道", value: "企业微信" },
          ],
        },
        {
          id: "input",
          at: "12:48:02",
          status: "ok",
          headline: "回复上下文快照",
          kv: [
            { label: "工单号", value: "GD2025060441" },
            { label: "客户回复", value: "希望调整交付周期" },
          ],
        },
        {
          id: "rules",
          at: "12:48:05",
          status: "ok",
          headline: "未达 Action 阈值",
          bullets: ["交付周期调整 → 信息性回复", "无需立即跟进 Action"],
        },
        {
          id: "llm",
          at: "12:48:12",
          status: "ok",
          headline: "GPT-4o 推理完成",
          kv: [
            { label: "模型", value: "GPT-4o" },
            { label: "Tokens", value: "512 in / 198 out" },
            { label: "耗时", value: "14.2s" },
            { label: "成本", value: "¥0.014" },
          ],
        },
        {
          id: "tools",
          at: "12:48:18",
          status: "skip",
          headline: "无需工具调用",
          bullets: ["规则判定为信息性场景，跳过工具链"],
        },
        {
          id: "output",
          at: "12:48:22",
          status: "ok",
          headline: "洞察输出",
          kv: [
            { label: "主洞察", value: "客户关注交付周期，无需立即 Action" },
            { label: "置信度", value: "0.72" },
          ],
        },
        {
          id: "action",
          at: "12:48:22",
          status: "skip",
          headline: "未生成 Action",
          bullets: ["置信度与规则均未达 Action 生成阈值"],
        },
      ],
      logs: [
        { at: "12:48:01", level: "INFO", message: "Run started (customer_reply)" },
        { at: "12:48:22", level: "INFO", message: "No action threshold met" },
      ],
    }),
    run({
      id: "RUN-20250609-1285",
      agentId: FOLLOW_UP_AGENT_ID,
      agentName: FOLLOW_UP_AGENT_NAME,
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
      errorCount: 1,
      retryCount: 0,
      errorSummary: "FSM 工具超时",
      pipeline: [
        {
          id: "trigger",
          at: "12:15:00",
          status: "ok",
          headline: "手动触发",
          kv: [{ label: "操作人", value: "张管家" }],
        },
        {
          id: "input",
          at: "12:15:02",
          status: "ok",
          headline: "上下文快照",
          kv: [
            { label: "工单号", value: "WO-88421" },
            { label: "停滞时长", value: "11 天" },
          ],
        },
        {
          id: "rules",
          at: "12:15:10",
          status: "ok",
          headline: "命中停滞唤醒规则",
          bullets: ["工单停滞 > 7 天 → 命中"],
        },
        {
          id: "llm",
          at: "12:15:18",
          status: "ok",
          headline: "Claude Sonnet 3.5 推理完成",
          kv: [
            { label: "Tokens", value: "620 in / 280 out" },
            { label: "成本", value: "¥0.016" },
          ],
        },
        {
          id: "tools",
          at: "12:15:52",
          status: "fail",
          headline: "FSM 工具调用超时",
          code: `fsm.getWorkOrder("WO-88421") → TIMEOUT (30s)\n// 已记录异常，未继续后续步骤`,
        },
        {
          id: "output",
          at: "12:15:52",
          status: "fail",
          headline: "输出中断",
          bullets: ["工具层失败，未生成洞察"],
        },
        {
          id: "action",
          at: "12:15:52",
          status: "fail",
          headline: "未生成 Action",
          bullets: ["运行异常终止"],
        },
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
      errorCount: 0,
      retryCount: 0,
      pipeline: [
        {
          id: "trigger",
          at: "11:42:00",
          status: "ok",
          headline: "定时扫描触发",
          kv: [{ label: "扫描范围", value: "待审批合同" }],
        },
        {
          id: "input",
          at: "11:42:02",
          status: "ok",
          headline: "合同快照",
          kv: [{ label: "合同号", value: "HT2025060112" }],
        },
        {
          id: "rules",
          at: "11:42:06",
          status: "ok",
          headline: "法务审批停滞规则命中",
          bullets: ["审批停滞 > 2 工作日 → 命中"],
        },
        {
          id: "llm",
          at: "11:42:14",
          status: "ok",
          headline: "Claude Sonnet 3.5 推理完成",
          kv: [
            { label: "Tokens", value: "480 in / 210 out" },
            { label: "成本", value: "¥0.012" },
          ],
        },
        {
          id: "tools",
          at: "11:42:22",
          status: "ok",
          headline: "合同系统查询成功",
          code: `contract.getApprovalStatus("HT2025060112") → pending_legal (3d)`,
        },
        {
          id: "output",
          at: "11:42:28",
          status: "ok",
          headline: "洞察输出",
          kv: [{ label: "主洞察", value: "法务审批停滞 3 个工作日" }],
        },
        {
          id: "action",
          at: "11:42:30",
          status: "ok",
          headline: "Action 已生成",
          kv: [
            { label: "Action ID", value: "ma-2" },
            { label: "类型", value: "催办法务审批" },
          ],
        },
      ],
      logs: [{ at: "11:42:30", level: "INFO", message: "Action ma-2 generated" }],
    }),
    run({
      id: "RUN-20250609-1283",
      agentId: FOLLOW_UP_AGENT_ID,
      agentName: FOLLOW_UP_AGENT_NAME,
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
      errorCount: 1,
      retryCount: 1,
      errorSummary: "LLM 首次超时",
      pipeline: [
        {
          id: "trigger",
          at: "11:20:00",
          status: "ok",
          headline: "定时扫描触发",
        },
        {
          id: "input",
          at: "11:20:01",
          status: "ok",
          headline: "商机快照",
          kv: [{ label: "商机", value: "云帆实业签约催办" }],
        },
        {
          id: "rules",
          at: "11:20:05",
          status: "ok",
          headline: "签约催办规则命中",
        },
        {
          id: "llm",
          at: "11:20:35",
          status: "warn",
          headline: "LLM 首次超时后重试成功",
          kv: [
            { label: "首次尝试", value: "11:20:15 超时 (30s)" },
            { label: "重试", value: "第 1 次 · 成功" },
            { label: "Tokens", value: "710 in / 320 out" },
            { label: "成本", value: "¥0.022（含重试）" },
          ],
        },
        {
          id: "tools",
          at: "11:20:40",
          status: "ok",
          headline: "CRM 查询成功",
          code: `crm.getOpportunity("GD2025060888") → 200 OK`,
        },
        {
          id: "output",
          at: "11:20:43",
          status: "ok",
          headline: "洞察输出",
          kv: [{ label: "主洞察", value: "签约流程停滞，建议管家电话确认" }],
        },
        {
          id: "action",
          at: "11:20:45",
          status: "ok",
          headline: "Action 已生成（重试后）",
          kv: [{ label: "Action ID", value: "ma-6" }],
        },
      ],
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
      errorCount: 0,
      retryCount: 0,
      pipeline: [
        {
          id: "trigger",
          at: "10:55:00",
          status: "ok",
          headline: "客户投诉回复触发",
        },
        {
          id: "input",
          at: "10:55:01",
          status: "ok",
          headline: "投诉上下文",
          kv: [{ label: "投诉单", value: "交付延迟" }],
        },
        {
          id: "rules",
          at: "10:55:04",
          status: "ok",
          headline: "投诉回访规则命中",
        },
        {
          id: "llm",
          at: "10:55:12",
          status: "ok",
          headline: "GPT-4o 推理完成",
          kv: [{ label: "成本", value: "¥0.009" }],
        },
        {
          id: "tools",
          at: "10:55:15",
          status: "ok",
          headline: "工单系统查询",
          code: `fsm.getComplaint("CMP-8821") → open`,
        },
        {
          id: "output",
          at: "10:55:17",
          status: "ok",
          headline: "洞察输出",
          kv: [{ label: "主洞察", value: "客户对交付延迟不满，需优先回访" }],
        },
        {
          id: "action",
          at: "10:55:18",
          status: "ok",
          headline: "Action 已生成",
          kv: [
            { label: "Action ID", value: "ma-5" },
            { label: "类型", value: "投诉回访" },
          ],
        },
      ],
      logs: [{ at: "10:55:18", level: "INFO", message: "Action ma-5 generated" }],
    }),
    run({
      id: "RUN-20250609-1281",
      agentId: FOLLOW_UP_AGENT_ID,
      agentName: FOLLOW_UP_AGENT_NAME,
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
      errorCount: 0,
      retryCount: 0,
      pipeline: [
        {
          id: "trigger",
          at: "10:30:00",
          status: "ok",
          headline: "定时扫描触发",
        },
        {
          id: "input",
          at: "10:30:01",
          status: "ok",
          headline: "商机快照",
          kv: [{ label: "报价发出", value: "46 小时前" }],
        },
        {
          id: "rules",
          at: "10:30:04",
          status: "ok",
          headline: "48h 跟进规则命中",
        },
        {
          id: "llm",
          at: "10:30:05",
          status: "skip",
          headline: "Heuristic 路径（无 LLM）",
          bullets: ["规则可直接判定，跳过模型调用"],
        },
        {
          id: "tools",
          at: "10:30:08",
          status: "skip",
          headline: "无需工具调用",
        },
        {
          id: "output",
          at: "10:30:20",
          status: "ok",
          headline: "规则输出",
          kv: [{ label: "结论", value: "48h 无跟进，建议电话确认" }],
        },
        {
          id: "action",
          at: "10:30:22",
          status: "ok",
          headline: "Action 已生成",
          kv: [{ label: "Action ID", value: "ma-7" }],
        },
      ],
      logs: [{ at: "10:30:22", level: "INFO", message: "Heuristic path used" }],
    }),
    run({
      id: "RUN-20250609-1280",
      agentId: FOLLOW_UP_AGENT_ID,
      agentName: FOLLOW_UP_AGENT_NAME,
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
      errorCount: 1,
      retryCount: 0,
      errorSummary: "CRM 记录缺失",
      pipeline: [
        {
          id: "trigger",
          at: "09:48:00",
          status: "ok",
          headline: "定时扫描触发",
        },
        {
          id: "input",
          at: "09:48:12",
          status: "fail",
          headline: "上下文加载失败",
          kv: [{ label: "客户 ID", value: "CUS-99102" }],
          bullets: ["CRM 客户记录未找到"],
        },
        {
          id: "rules",
          at: "09:48:12",
          status: "skip",
          headline: "已跳过",
        },
        {
          id: "llm",
          at: "09:48:12",
          status: "skip",
          headline: "已跳过",
        },
        {
          id: "tools",
          at: "09:48:12",
          status: "skip",
          headline: "已跳过",
        },
        {
          id: "output",
          at: "09:48:12",
          status: "fail",
          headline: "无输出",
        },
        {
          id: "action",
          at: "09:48:12",
          status: "fail",
          headline: "未生成 Action",
        },
      ],
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
      errorCount: 0,
      retryCount: 0,
      pipeline: [
        {
          id: "trigger",
          at: "09:12:00",
          status: "ok",
          headline: "手动触发",
        },
        {
          id: "input",
          at: "09:12:02",
          status: "ok",
          headline: "合同修订快照",
          kv: [{ label: "修订版本", value: "Rev.B" }],
        },
        {
          id: "rules",
          at: "09:12:08",
          status: "ok",
          headline: "条款变更需确认",
        },
        {
          id: "llm",
          at: "09:12:18",
          status: "ok",
          headline: "Claude Sonnet 3.5 推理完成",
          kv: [{ label: "成本", value: "¥0.014" }],
        },
        {
          id: "tools",
          at: "09:12:24",
          status: "ok",
          headline: "合同 diff 获取",
          code: `contract.getRevisionDiff("HT2025060201", "Rev.B") → 3 clauses changed`,
        },
        {
          id: "output",
          at: "09:12:28",
          status: "ok",
          headline: "洞察输出",
          kv: [{ label: "主洞察", value: "付款条款变更需客户书面确认" }],
        },
        {
          id: "action",
          at: "09:12:31",
          status: "ok",
          headline: "Action 已生成",
          kv: [
            { label: "Action ID", value: "ma-8" },
            { label: "类型", value: "条款修订确认" },
          ],
        },
      ],
      logs: [{ at: "09:12:31", level: "INFO", message: "Action ma-8 generated" }],
    }),
    run({
      id: "RUN-20250609-1278",
      agentId: FOLLOW_UP_AGENT_ID,
      agentName: FOLLOW_UP_AGENT_NAME,
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
      errorCount: 0,
      retryCount: 0,
      pipeline: [
        {
          id: "trigger",
          at: "08:40:00",
          status: "ok",
          headline: "定时扫描触发",
        },
        {
          id: "input",
          at: "08:40:02",
          status: "ok",
          headline: "商机快照",
          kv: [{ label: "状态", value: "已签约" }],
        },
        {
          id: "rules",
          at: "08:40:06",
          status: "ok",
          headline: "已签约 → 跳过跟进",
        },
        {
          id: "llm",
          at: "08:40:10",
          status: "ok",
          headline: "GPT-4o 轻量确认",
          kv: [{ label: "成本", value: "¥0.006" }],
        },
        {
          id: "tools",
          at: "08:40:14",
          status: "skip",
          headline: "无需工具调用",
        },
        {
          id: "output",
          at: "08:40:18",
          status: "ok",
          headline: "结论",
          kv: [{ label: "结论", value: "无需跟进" }],
        },
        {
          id: "action",
          at: "08:40:19",
          status: "skip",
          headline: "未生成 Action",
          bullets: ["商机已签约，规则跳过 Action 生成"],
        },
      ],
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

export function formatErrorRetry(run: MockRun): string {
  const parts: string[] = [];
  if (run.errorCount > 0) {
    parts.push(`${run.errorCount} 错误`);
  }
  if (run.retryCount > 0) {
    parts.push(`${run.retryCount} 重试`);
  }
  if (parts.length === 0) return "—";
  return parts.join(" · ");
}
