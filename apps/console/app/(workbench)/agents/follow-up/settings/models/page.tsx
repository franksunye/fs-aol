import { FollowUpModelStrategyPage } from "@/components/agents/follow-up-model-strategy-page";
import { buildModelStrategyView } from "@/lib/adapters/follow-up-model-strategy";
import { loadModelStrategyLiveStats } from "@/lib/model-strategy-live";
import {
  getRuntimeConfigForUi,
  listRuntimeConfigRevisions,
} from "@/lib/runtime-config/store";
import { getLatestEngineRuntimeSnapshot } from "@/lib/tracking/engine-runtime";

export const dynamic = "force-dynamic";

export default async function FollowUpModelStrategyRoutePage() {
  const [liveStats, runtimeUi, engineSnapshot, revisions] = await Promise.all([
    loadModelStrategyLiveStats(),
    getRuntimeConfigForUi(),
    getLatestEngineRuntimeSnapshot(),
    listRuntimeConfigRevisions(),
  ]);
  const runtimeConfig = runtimeUi?.runtime ?? null;
  const view = buildModelStrategyView({
    runtimeConfig,
    engineSnapshot,
    liveStats,
    revisions,
  });
  return <FollowUpModelStrategyPage view={view} />;
}
