import { Suspense } from "react";
import { cookies } from "next/headers";
import { RunsPage } from "@/components/runs/runs-page";
import { HOUSEKEEPER_FILTER_COOKIE } from "@/components/housekeeper-filter";

export default async function RunsRoutePage() {
  const cookieStore = await cookies();
  const hkFilter =
    cookieStore.get(HOUSEKEEPER_FILTER_COOKIE)?.value?.trim() || undefined;

  return (
    <Suspense fallback={null}>
      <RunsPage hkFilter={hkFilter} />
    </Suspense>
  );
}
