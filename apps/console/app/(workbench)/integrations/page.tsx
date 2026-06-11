import { Suspense } from "react";
import { IntegrationsPage } from "@/components/integrations/integrations-page";
import { db, ensureSchema } from "@/lib/db";
import { getRuntimeConfig } from "@/lib/runtime-config/store";
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
  const [runtime, snapshot] = await Promise.all([
    getRuntimeConfig(),
    getLatestEngineRuntimeSnapshot(),
  ]);
  return (
    <Suspense fallback={null}>
      <IntegrationsPage
        runtimeConfig={runtime}
        tursoOk={tursoOk}
        snapshotRunAt={snapshot?.runAt ?? null}
      />
    </Suspense>
  );
}
