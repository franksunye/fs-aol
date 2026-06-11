import { Suspense } from "react";
import { AiInfrastructurePage } from "@/components/settings/ai-infrastructure-page";
import { loadAiInfraLiveContext } from "@/lib/ai-infra-live";

export const dynamic = "force-dynamic";

export default async function AiInfrastructureRoutePage() {
  const live = await loadAiInfraLiveContext();
  return (
    <Suspense fallback={null}>
      <AiInfrastructurePage liveContext={live} />
    </Suspense>
  );
}
