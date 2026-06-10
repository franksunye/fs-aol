import { cookies } from "next/headers";
import { HOUSEKEEPER_FILTER_COOKIE } from "@/components/housekeeper-filter";
import { EvaluationPage } from "@/components/evaluation/evaluation-page";
import { loadEvaluationSnapshot } from "@/lib/evaluation";
import { evaluationFiltersFromSearchParams } from "@/lib/evaluation-mock";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    hk?: string;
    esite?: string;
    eagent?: string;
    eaction?: string;
  }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const hkFromCookie = cookieStore.get(HOUSEKEEPER_FILTER_COOKIE)?.value?.trim();
  const hkFilter = sp.hk?.trim() || hkFromCookie || undefined;
  const filters = evaluationFiltersFromSearchParams(sp);

  const data = await loadEvaluationSnapshot({
    filters,
    housekeeperId: hkFilter,
  });

  return <EvaluationPage data={data} hk={hkFilter} />;
}
