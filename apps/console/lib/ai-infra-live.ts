import { loadModelStrategyLiveStats } from "./model-strategy-live";
import { getLatestEngineRuntimeSnapshot } from "./tracking/engine-runtime";

const PROVIDER_ID_MAP: Record<string, string> = {
  hunyuan: "hunyuan",
  heuristic: "heuristic",
  deepseek: "deepseek",
  openai: "openai",
  custom: "openai",
};

export type AiInfraLiveContext = {
  activeProviderId: string | null;
  providerLabel: string;
  stats: Awaited<ReturnType<typeof loadModelStrategyLiveStats>>;
};

export async function loadAiInfraLiveContext(): Promise<AiInfraLiveContext> {
  const [stats, runtime] = await Promise.all([
    loadModelStrategyLiveStats(),
    getLatestEngineRuntimeSnapshot(),
  ]);
  const provider = String(runtime?.snapshot?.llm_provider ?? stats?.llmProvider ?? "");
  const activeProviderId = PROVIDER_ID_MAP[provider] ?? null;
  return {
    activeProviderId,
    providerLabel: provider || "—",
    stats,
  };
}
