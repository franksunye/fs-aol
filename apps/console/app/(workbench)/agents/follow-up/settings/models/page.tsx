import { FollowUpModelStrategyPage } from "@/components/agents/follow-up-model-strategy-page";
import { loadModelStrategyLiveStats } from "@/lib/model-strategy-live";
import { getRuntimeConfig } from "@/lib/runtime-config/store";

export const dynamic = "force-dynamic";

export default async function FollowUpModelStrategyRoutePage() {
  const [liveStats, runtimeConfig] = await Promise.all([
    loadModelStrategyLiveStats(),
    getRuntimeConfig(),
  ]);
  return (
    <FollowUpModelStrategyPage
      liveStats={liveStats}
      runtimeConfig={runtimeConfig}
    />
  );
}
