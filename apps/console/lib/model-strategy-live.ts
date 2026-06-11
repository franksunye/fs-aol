import { loadTraceCostAggregate, resolveDateRange } from "./analytics";
import { getLatestEngineRuntimeSnapshot } from "./tracking/engine-runtime";

export type ModelStrategyLiveStats = {
  runCount: number;
  avgLatencyMs: number;
  totalTokens: number;
  estCostYuan: number;
  llmProvider: string;
  llmModel: string;
  agentMode: string;
};

export async function loadModelStrategyLiveStats(): Promise<ModelStrategyLiveStats | null> {
  const range = resolveDateRange("last_7");
  const [traceCost, runtime] = await Promise.all([
    loadTraceCostAggregate(range),
    getLatestEngineRuntimeSnapshot(),
  ]);
  if (traceCost.runCount === 0 && !runtime) return null;
  const s = runtime?.snapshot ?? {};
  return {
    runCount: traceCost.runCount,
    avgLatencyMs: traceCost.avgLatencyMs,
    totalTokens: traceCost.totalTokens,
    estCostYuan: Math.round((traceCost.totalTokens / 1000) * 0.02 * 100) / 100,
    llmProvider: String(s.llm_provider ?? "—"),
    llmModel: String(s.llm_model ?? "—"),
    agentMode: String(s.agent_mode ?? "—"),
  };
}
