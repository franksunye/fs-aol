import { Suspense } from "react";
import { AiInfrastructurePage } from "@/components/settings/ai-infrastructure-page";
import { loadAiInfraLiveContext } from "@/lib/ai-infra-live";
import { getRuntimeConfigForUi } from "@/lib/runtime-config/store";
import { getLatestEngineRuntimeSnapshot } from "@/lib/tracking/engine-runtime";

export const dynamic = "force-dynamic";

export default async function AiInfrastructureRoutePage() {
  const [live, runtimeUi, snapshot] = await Promise.all([
    loadAiInfraLiveContext(),
    getRuntimeConfigForUi(),
    getLatestEngineRuntimeSnapshot(),
  ]);
  return (
    <Suspense fallback={null}>
      <AiInfrastructurePage
        liveContext={live}
        runtimeConfig={runtimeUi?.runtime ?? null}
        runtimeBootstrap={runtimeUi?.isBootstrap ?? false}
        snapshotRunAt={snapshot?.runAt ?? null}
        snapshotProvider={snapshot?.snapshot?.llm_provider as string | undefined}
      />
    </Suspense>
  );
}
