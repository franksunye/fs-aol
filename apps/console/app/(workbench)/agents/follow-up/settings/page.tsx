import { FollowUpAgentSettingsPage } from "@/components/agents/follow-up-agent-settings-page";
import { getRuntimeConfig } from "@/lib/runtime-config/store";
import { getLatestEngineRuntimeSnapshot } from "@/lib/tracking/engine-runtime";

export const dynamic = "force-dynamic";

export default async function FollowUpAgentSettingsRoutePage() {
  const [runtime, runtimeConfig] = await Promise.all([
    getLatestEngineRuntimeSnapshot(),
    getRuntimeConfig(),
  ]);
  return (
    <FollowUpAgentSettingsPage
      runtime={runtime}
      runtimeConfig={runtimeConfig}
    />
  );
}
