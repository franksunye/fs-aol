import { Suspense } from "react";
import { cookies } from "next/headers";
import { RunsPage } from "@/components/runs/runs-page";
import { HOUSEKEEPER_FILTER_COOKIE } from "@/components/housekeeper-filter";
import {
  computeRunsSummaryFromDb,
  getRunById,
  listRunsPage,
} from "@/lib/tracking/runs";
import type { RunQuickFilter } from "@/lib/runs-mock";

export const dynamic = "force-dynamic";

function parseQuickFilter(value?: string | null): RunQuickFilter {
  if (value === "success" || value === "anomaly" || value === "retried") {
    return value;
  }
  return "all";
}

export default async function RunsRoutePage({
  searchParams,
}: {
  searchParams: Promise<{
    hk?: string;
    rquick?: string;
    ragent?: string;
    rstatus?: string;
    rmodel?: string;
    rq?: string;
    run?: string;
    rp?: string;
    rps?: string;
  }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const hkFromCookie = cookieStore.get(HOUSEKEEPER_FILTER_COOKIE)?.value?.trim();
  const hkFilter = sp.hk?.trim() || hkFromCookie || undefined;

  const page = Math.max(1, Number(sp.rp) || 1);
  const pageSize = Math.min(Math.max(Number(sp.rps) || 50, 1), 100);

  const [{ runs, total }, summary, selectedRun] = await Promise.all([
    listRunsPage({
      housekeeperId: hkFilter,
      quick: parseQuickFilter(sp.rquick),
      agentId: sp.ragent?.trim() || "all",
      status: sp.rstatus?.trim() || "all",
      model: sp.rmodel?.trim() || "all",
      query: sp.rq?.trim() || "",
      page,
      pageSize,
    }),
    computeRunsSummaryFromDb({ housekeeperId: hkFilter }),
    sp.run?.trim() ? getRunById(sp.run.trim()) : Promise.resolve(null),
  ]);

  return (
    <Suspense fallback={null}>
      <RunsPage
        hkFilter={hkFilter}
        runs={runs}
        total={total}
        summary={summary}
        selectedRun={selectedRun}
      />
    </Suspense>
  );
}
