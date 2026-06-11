import { FollowUpModelStrategyPage } from "@/components/agents/follow-up-model-strategy-page";
import { loadModelStrategyLiveStats } from "@/lib/model-strategy-live";

export const dynamic = "force-dynamic";

export default async function FollowUpModelStrategyRoutePage() {
  const liveStats = await loadModelStrategyLiveStats();
  return <FollowUpModelStrategyPage liveStats={liveStats} />;
}
