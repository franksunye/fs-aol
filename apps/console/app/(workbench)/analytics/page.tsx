import { Suspense } from "react";
import { cookies } from "next/headers";
import { BarChart3 } from "lucide-react";
import {
  loadAnalyticsSnapshot,
  parseAnalyticsRangeKey,
} from "@/lib/analytics";
import { loadPilotHousekeepers, housekeeperName } from "@/lib/pilot-housekeepers";
import { HOUSEKEEPER_FILTER_COOKIE } from "@/components/housekeeper-filter";
import { shellScrollClass } from "@/lib/shell-preferences";
import { cn } from "@/lib/utils";
import { AnalyticsRangeSelect } from "@/components/analytics/analytics-range-select";
import { AnalyticsMetricCards } from "@/components/analytics/analytics-metric-cards";
import { AnalyticsTrendChart } from "@/components/analytics/analytics-trend-chart";
import { AnalyticsPriorityChart } from "@/components/analytics/analytics-priority-chart";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; hk?: string }>;
}) {
  const sp = await searchParams;
  const rangeKey = parseAnalyticsRangeKey(sp.range);
  const cookieStore = await cookies();
  const hkFromCookie = cookieStore.get(HOUSEKEEPER_FILTER_COOKIE)?.value?.trim();
  const hkFilter = sp.hk?.trim() || hkFromCookie || undefined;
  const pilots = loadPilotHousekeepers();
  const displayName = hkFilter
    ? housekeeperName(pilots, hkFilter)
    : "全部管家";

  const data = await loadAnalyticsSnapshot({
    rangeKey,
    housekeeperId: hkFilter,
  });

  return (
    <main className={cn(shellScrollClass, "h-full w-full px-6 py-8 lg:px-8")}>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-xs font-bold">
              <BarChart3 className="size-4" aria-hidden />
            </span>
            <h1 className="text-xl font-semibold tracking-tight">分析洞察</h1>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            {displayName} · Agent 发现机会、处置行动与金额推动（真实库内统计）
          </p>
        </div>
        <Suspense fallback={null}>
          <AnalyticsRangeSelect
            currentKey={rangeKey}
            rangeLabel={data.range.label}
            hk={hkFilter}
          />
        </Suspense>
      </header>

      <div className="space-y-6">
        <AnalyticsMetricCards data={data} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <AnalyticsTrendChart points={data.trend} />
          <AnalyticsPriorityChart
            slices={data.priorityDistribution}
            total={data.discovered}
          />
        </div>
      </div>
    </main>
  );
}
