import { FollowUpAgentSettingsPage } from "@/components/agents/follow-up-agent-settings-page";
import { getLatestEngineRuntimeSnapshot } from "@/lib/tracking/engine-runtime";

export const dynamic = "force-dynamic";

export default async function FollowUpAgentSettingsRoutePage() {
  const runtime = await getLatestEngineRuntimeSnapshot();
  return <FollowUpAgentSettingsPage runtime={runtime} />;
}
