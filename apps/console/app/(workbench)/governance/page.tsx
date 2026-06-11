import { Suspense } from "react";
import { cookies } from "next/headers";
import { GovernancePage } from "@/components/governance/governance-page";
import { HOUSEKEEPER_FILTER_COOKIE } from "@/components/housekeeper-filter";
import { loadFollowUpAuditFeed } from "@/lib/governance-audit";
import { loadGovernanceLiveSummary } from "@/lib/governance-live-summary";
import { getRuntimeConfig } from "@/lib/runtime-config/store";

export const dynamic = "force-dynamic";

export default async function GovernanceRoutePage() {
  const cookieStore = await cookies();
  const hkFilter =
    cookieStore.get(HOUSEKEEPER_FILTER_COOKIE)?.value?.trim() || undefined;
  const [auditRows, liveSummary, runtimeConfig] = await Promise.all([
    loadFollowUpAuditFeed(20),
    loadGovernanceLiveSummary(),
    getRuntimeConfig(),
  ]);

  return (
    <Suspense fallback={null}>
      <GovernancePage
        hkFilter={hkFilter}
        auditRows={auditRows}
        liveSummary={liveSummary}
        runtimeConfig={runtimeConfig}
      />
    </Suspense>
  );
}
