import type { ModelStrategyLiveStats } from "@/lib/model-strategy-live";
import type { RuntimeConfigPublic } from "@/lib/runtime-config/store";
import type { RuntimeConfigRevisionSummary } from "@/lib/runtime-config/store";
import type { EngineRuntimeSnapshot } from "@/lib/tracking/engine-runtime";

export type ModelStrategyDataState = "live" | "not_connected" | "scenario";

export type ModelTaskRouteRow = {
  id: string;
  task: string;
  model: string;
  fallback: string;
  status: "active" | "standby" | "disabled";
  dataState: ModelStrategyDataState;
};

export type ModelConstraintRow = {
  id: string;
  label: string;
  enabled: boolean;
  dataState: ModelStrategyDataState;
  hint?: string;
};

export type ModelStrategyView = {
  primaryModel: {
    provider: string;
    model: string;
    agentMode: string;
    agentModeLabel: string;
    dataState: ModelStrategyDataState;
    editHref: string;
  };
  backupModel: { label: string; dataState: ModelStrategyDataState };
  visionModel: { label: string; dataState: ModelStrategyDataState };
  taskRoutes: ModelTaskRouteRow[];
  constraints: ModelConstraintRow[];
  prompt: {
    name: string;
    hint: string;
    dataState: ModelStrategyDataState;
  };
  metrics: {
    runCount: number;
    avgLatencyMs: number;
    totalTokens: number;
    estimatedCost: number;
    dataState: ModelStrategyDataState;
  } | null;
  summary: {
    status: string;
    primaryModel: string;
    configVersion: string;
    lastPublishedAt: string;
  };
  publishHistory: {
    version: string;
    summary: string;
    at: string;
  }[];
};

function agentModeLabel(mode: string): string {
  return mode === "steps" ? "分步推理" : "单次推理";
}

function formatAt(iso: string): string {
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

export function buildModelStrategyView(opts: {
  runtimeConfig: RuntimeConfigPublic | null;
  engineSnapshot: EngineRuntimeSnapshot | null;
  liveStats: ModelStrategyLiveStats | null;
  revisions: RuntimeConfigRevisionSummary[];
}): ModelStrategyView {
  const cfg = opts.runtimeConfig?.config;
  const snap = opts.engineSnapshot?.snapshot;
  const version = opts.runtimeConfig?.version ?? 0;
  const provider =
    (snap?.llm_provider as string) ?? cfg?.llm_provider ?? "heuristic";
  const model = (snap?.llm_model as string) ?? cfg?.llm_model ?? "—";
  const agentMode = cfg?.agent_mode ?? (snap?.agent_mode as string) ?? "steps";
  const dryRun = cfg?.dry_run ?? true;
  const structuredOutput =
    provider === "deepseek" || provider === "heuristic"
      ? provider !== "heuristic"
      : false;

  const taskRoutes: ModelTaskRouteRow[] = [
    {
      id: "enrich",
      task: "上下文丰富（enrich）",
      model: "工具调用 · 无 LLM",
      fallback: "—",
      status: "active",
      dataState: "live",
    },
    {
      id: "suggest",
      task: "跟进建议生成（suggest）",
      model: `${provider} / ${model}`,
      fallback: "heuristic 降级",
      status: "active",
      dataState: provider === "heuristic" ? "not_connected" : "live",
    },
    {
      id: "heuristic",
      task: "启发式降级",
      model: "规则引擎",
      fallback: "—",
      status: "standby",
      dataState: "live",
    },
  ];

  const constraints: ModelConstraintRow[] = [
    {
      id: "structured-json",
      label: "结构化 JSON 输出",
      enabled: structuredOutput,
      dataState: provider === "deepseek" ? "live" : "not_connected",
      hint: "DeepSeek 路径启用 JSON mode",
    },
    {
      id: "dry-run",
      label: "预览模式（不真发企微）",
      enabled: dryRun,
      dataState: "live",
    },
    {
      id: "reanalyze",
      label: "时间触发再分析",
      enabled: cfg?.reanalyze_enabled ?? false,
      dataState: "live",
    },
    {
      id: "human-approval",
      label: "人工审批后执行",
      enabled: true,
      dataState: "scenario",
      hint: "治理中心配置",
    },
  ];

  const publishHistory = opts.revisions.map((r) => ({
    version: `v${r.version}`,
    summary: r.changeSummary || "配置更新",
    at: formatAt(r.updatedAt),
  }));

  const stats = opts.liveStats;

  return {
    primaryModel: {
      provider,
      model,
      agentMode,
      agentModeLabel: agentModeLabel(agentMode),
      dataState: version > 0 ? "live" : "not_connected",
      editHref: "/settings/ai",
    },
    backupModel: { label: "未配置", dataState: "not_connected" },
    visionModel: { label: "未配置", dataState: "not_connected" },
    taskRoutes,
    constraints,
    prompt: {
      name: "内置跟进建议 Prompt",
      hint: "引擎 packages/aol 内置 SYSTEM_PROMPT， wedge 阶段不可在线编辑",
      dataState: "live",
    },
    metrics: stats
      ? {
          runCount: stats.runCount,
          avgLatencyMs: stats.avgLatencyMs,
          totalTokens: stats.totalTokens,
          estimatedCost: stats.estCostYuan,
          dataState: "live",
        }
      : null,
    summary: {
      status: version > 0 ? "运行中" : "未配置",
      primaryModel: `${provider} / ${model}`,
      configVersion: version > 0 ? `v${version}` : "—",
      lastPublishedAt: publishHistory[0]?.at ?? "—",
    },
    publishHistory,
  };
}
