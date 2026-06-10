import { Suspense } from "react";
import { cookies } from "next/headers";
import { HOUSEKEEPER_FILTER_COOKIE } from "@/components/housekeeper-filter";
import { OverviewPage } from "@/components/overview/overview-page";
import { loadOverviewSnapshot } from "@/lib/overview";

export const dynamic = "force-dynamic";

export default async function OverviewRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ hk?: string }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const hkFromCookie = cookieStore.get(HOUSEKEEPER_FILTER_COOKIE)?.value?.trim();
  const hkFilter = sp.hk?.trim() || hkFromCookie || undefined;

  const data = await loadOverviewSnapshot(hkFilter);

  return (
    <Suspense fallback={null}>
      <OverviewPage data={data} hk={hkFilter} />
    </Suspense>
  );
}
