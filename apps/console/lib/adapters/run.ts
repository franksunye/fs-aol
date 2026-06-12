import { eventTypeLabel } from "../labels";
import { FOLLOW_UP_SKILL } from "../skills";
import type {
  MockRun,
  PipelineStage,
  RunLogLine,
  RunStatus,
} from "../runs-mock";
import { actionTitle } from "../action-list-display";
import type { SuggestionDoc, TraceRow } from "../tracking/types";

const FOLLOW_UP_AGENT_ID = FOLLOW_UP_SKILL.id;
const FOLLOW_UP_AGENT_NAME = FOLLOW_UP_SKILL.productName;
const TOKEN_COST_YUAN_PER_1K = 0.002;

export function formatTraceRunId(traceId: number): string {
  return `trace-${traceId}`;
}

export function parseTraceRunId(runId: string): number | null {
  const m = /^trace-(\d+)$/.exec(runId.trim());
  return m ? Number(m[1]) : null;
}

function formatStartedAt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

function deriveRunStatus(
  trace: TraceRow,
  analysisRound: number
): RunStatus {
  if (trace.status !== "ok" || trace.error) return "anomaly";
  if (analysisRound > 1) return "retried";
  const failedStep = trace.steps.find((s) => s.status === "fail");
  if (failedStep) return "anomaly";
  return "success";
}

function estimateCostYuan(trace: TraceRow): number {
  const tokens = trace.totalTokens || 0;
  return Math.round((tokens / 1000) * TOKEN_COST_YUAN_PER_1K * 1000) / 1000;
}

function buildPipelineFromTrace(
  trace: TraceRow,
  eventType: string,
  suggestion: SuggestionDoc | null
): PipelineStage[] {
  const stages: PipelineStage[] = [
    {
      id: "trigger",
      at: formatStartedAt(trace.createdAt),
      status: "ok",
      headline: "定时扫描触发",
      kv: [{ label: "事件", value: eventTypeLabel(eventType) }],
    },
  ];

  for (const step of trace.steps) {
    if (step.name === "enrich_work_order_context") {
      stages.push({
        id: "tools",
        at: formatStartedAt(trace.createdAt),
        status: step.status === "fail" ? "fail" : "ok",
        headline: "上下文 enrich",
        kv: [
          {
            label: "耗时",
            value: `${step.latency_ms ?? 0}ms`,
          },
        ],
      });
    }
    if (step.kind === "llm" || step.name === "suggest") {
      stages.push({
        id: "llm",
        at: formatStartedAt(trace.createdAt),
        status: step.status === "fail" ? "fail" : "ok",
        headline: `推理 · ${trace.model || "model"}`,
        kv: [
          { label: "模式", value: trace.mode },
          { label: "延迟", value: `${trace.latencyMs}ms` },
        ],
      });
    }
  }

  const mainAction =
    suggestion?.跟进方案?.主行动 || trace.parsed?.跟进方案?.主行动 || "";
  stages.push({
    id: "action",
    at: formatStartedAt(trace.createdAt),
    status: suggestion?.需要跟进 === false ? "skip" : "ok",
    headline: mainAction ? "产出跟进建议" : "未生成 Action",
    bullets: mainAction ? [mainAction] : undefined,
  });

  return stages;
}

function buildLogs(trace: TraceRow): RunLogLine[] {
  const lines: RunLogLine[] = [
    {
      at: formatStartedAt(trace.createdAt),
      level: trace.status === "ok" ? "INFO" : "ERROR",
      message: `trace #${trace.id} mode=${trace.mode} status=${trace.status}`,
    },
  ];
  if (trace.error) {
    lines.push({
      at: formatStartedAt(trace.createdAt),
      level: "ERROR",
      message: trace.error,
    });
  }
  return lines;
}

export function mapTraceToRun(input: {
  trace: TraceRow;
  dedupeKey?: string;
  orderNum?: string;
  eventType?: string;
  suggestion?: SuggestionDoc | null;
  analysisRound?: number;
}): MockRun {
  const {
    trace,
    dedupeKey,
    orderNum,
    eventType = "",
    suggestion = trace.parsed,
    analysisRound = 1,
  } = input;
  const durationSec =
    Math.round(
      ((trace.latencyMs || 0) +
        trace.steps.reduce((s, st) => s + (st.latency_ms ?? 0), 0)) /
        10
    ) / 100;
  const needsFollow = suggestion?.需要跟进 !== false;

  return {
    id: formatTraceRunId(trace.id),
    agentId: FOLLOW_UP_AGENT_ID,
    agentName: FOLLOW_UP_AGENT_NAME,
    triggerSource: eventTypeLabel(eventType) || "定时扫描",
    relatedObjectId: orderNum || trace.workOrderId,
    relatedObjectType: "工单",
    startedAt: formatStartedAt(trace.createdAt),
    status: deriveRunStatus(trace, analysisRound),
    durationSec: durationSec || trace.latencyMs / 1000,
    costYuan: estimateCostYuan(trace),
    version: "v0.4",
    model: trace.model || trace.mode || "heuristic",
    actionGenerated: needsFollow,
    actionId: dedupeKey,
    workOrderKey: dedupeKey,
    analysisRound: analysisRound > 1 ? analysisRound : undefined,
    errorCount: trace.status !== "ok" || trace.error ? 1 : 0,
    retryCount: analysisRound > 1 ? analysisRound - 1 : 0,
    errorSummary: trace.error || undefined,
    pipeline: buildPipelineFromTrace(trace, eventType, suggestion),
    logs: buildLogs(trace),
  };
}

export function actionTitleFromSuggestion(suggestion: SuggestionDoc): string {
  return actionTitle(suggestion) || suggestion.跟进方案?.主行动 || "跟进行动";
}
