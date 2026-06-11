import { Suspense } from "react";
import { AiInfrastructurePage } from "@/components/settings/ai-infrastructure-page";
import { loadAiInfraLiveContext } from "@/lib/ai-infra-live";
import { getRuntimeConfig } from "@/lib/runtime-config/store";
import { getLatestEngineRuntimeSnapshot } from "@/lib/tracking/engine-runtime";

export const dynamic = "force-dynamic";

export default async function AiInfrastructureRoutePage() {
  const [live, runtime, snapshot] = await Promise.all([
    loadAiInfraLiveContext(),
    getRuntimeConfig(),
    getLatestEngineRuntimeSnapshot(),
  ]);
  return (
    <Suspense fallback={null}>
      <AiInfrastructurePage
        liveContext={live}
        runtimeConfig={runtime}
        snapshotRunAt={snapshot?.runAt ?? null}
        snapshotProvider={snapshot?.snapshot?.llm_provider as string | undefined}
      />
    </Suspense>
  );
}
