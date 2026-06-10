import { Suspense } from "react";
import { cookies } from "next/headers";
import { HOUSEKEEPER_FILTER_COOKIE } from "@/components/housekeeper-filter";
import { OverviewPage } from "@/components/overview/overview-page";

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

  return (
    <Suspense fallback={null}>
      <OverviewPage hk={hkFilter} />
    </Suspense>
  );
}
