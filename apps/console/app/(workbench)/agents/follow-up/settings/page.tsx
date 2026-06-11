import { FollowUpAgentSettingsPage } from "@/components/agents/follow-up-agent-settings-page";
import { buildAgentSettingsView } from "@/lib/adapters/follow-up-agent-settings";
import { FSM_INTEGRATION_ID, integrationHref } from "@/lib/integrations-nav";
import {
  getRuntimeConfigForUi,
  listRuntimeConfigRevisions,
} from "@/lib/runtime-config/store";
import { getLatestEngineRuntimeSnapshot } from "@/lib/tracking/engine-runtime";

export const dynamic = "force-dynamic";

export default async function FollowUpAgentSettingsRoutePage() {
  const [runtime, runtimeUi, revisions] = await Promise.all([
    getLatestEngineRuntimeSnapshot(),
    getRuntimeConfigForUi(),
    listRuntimeConfigRevisions(),
  ]);
  const runtimeConfig = runtimeUi?.runtime ?? null;
  const view = buildAgentSettingsView({
    runtimeConfig,
    runtimeBootstrap: runtimeUi?.isBootstrap ?? false,
    engineSnapshot: runtime,
    revisions,
    fsmIntegrationHref: integrationHref(FSM_INTEGRATION_ID, "protocol"),
    fsmIngestionHref: integrationHref(FSM_INTEGRATION_ID, "ingestion"),
  });
  return (
    <FollowUpAgentSettingsPage
      view={view}
      runtimeConfig={runtimeConfig}
      runtimeBootstrap={runtimeUi?.isBootstrap ?? false}
    />
  );
}
