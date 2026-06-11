import { Suspense } from "react";
import { IntegrationsPage } from "@/components/integrations/integrations-page";
import { db, ensureSchema } from "@/lib/db";
import { mergeFsmLiveView } from "@/lib/integration-bindings";
import { getRuntimeConfigForUi } from "@/lib/runtime-config/store";
import { getLatestEngineRuntimeSnapshot } from "@/lib/tracking/engine-runtime";

export const dynamic = "force-dynamic";

export default async function IntegrationsRoutePage() {
  let tursoOk = false;
  try {
    await ensureSchema();
    await db.execute({ sql: "SELECT 1" });
    tursoOk = true;
  } catch {
    tursoOk = false;
  }
  const [runtimeUi, snapshot] = await Promise.all([
    getRuntimeConfigForUi(),
    getLatestEngineRuntimeSnapshot(),
  ]);
  const runtime = runtimeUi?.runtime ?? null;
  const fsmView = mergeFsmLiveView(runtime, snapshot);
  return (
    <Suspense fallback={null}>
      <IntegrationsPage
        runtimeConfig={runtime}
        runtimeBootstrap={runtimeUi?.isBootstrap ?? false}
        fsmView={fsmView}
        tursoOk={tursoOk}
        snapshotRunAt={snapshot?.runAt ?? null}
      />
    </Suspense>
  );
}
