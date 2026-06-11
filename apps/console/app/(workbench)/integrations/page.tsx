import { Suspense } from "react";
import { IntegrationsPage } from "@/components/integrations/integrations-page";
import { loadFollowUpLiveIntegrations } from "@/lib/integrations-live";

export const dynamic = "force-dynamic";

export default async function IntegrationsRoutePage() {
  const live = await loadFollowUpLiveIntegrations();
  return (
    <Suspense fallback={null}>
      <IntegrationsPage
        liveConnectors={live.connectors}
        snapshotRunAt={live.snapshotRunAt}
      />
    </Suspense>
  );
}
