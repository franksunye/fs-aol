import { Suspense } from "react";
import { cookies } from "next/headers";
import { GovernancePage } from "@/components/governance/governance-page";
import { HOUSEKEEPER_FILTER_COOKIE } from "@/components/housekeeper-filter";

export default async function GovernanceRoutePage() {
  const cookieStore = await cookies();
  const hkFilter =
    cookieStore.get(HOUSEKEEPER_FILTER_COOKIE)?.value?.trim() || undefined;

  return (
    <Suspense fallback={null}>
      <GovernancePage hkFilter={hkFilter} />
    </Suspense>
  );
}
