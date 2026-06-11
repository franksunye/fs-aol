import { Suspense } from "react";
import { cookies } from "next/headers";
import { GovernancePage } from "@/components/governance/governance-page";
import { HOUSEKEEPER_FILTER_COOKIE } from "@/components/housekeeper-filter";
import { loadFollowUpAuditFeed } from "@/lib/governance-audit";

export const dynamic = "force-dynamic";

export default async function GovernanceRoutePage() {
  const cookieStore = await cookies();
  const hkFilter =
    cookieStore.get(HOUSEKEEPER_FILTER_COOKIE)?.value?.trim() || undefined;
  const auditRows = await loadFollowUpAuditFeed(20);

  return (
    <Suspense fallback={null}>
      <GovernancePage hkFilter={hkFilter} auditRows={auditRows} />
    </Suspense>
  );
}
