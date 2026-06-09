import { Suspense } from "react";
import { cookies } from "next/headers";
import {
  listSuggestions,
  computeStats,
  countInboxBuckets,
} from "@/lib/suggestions";
import { loadPilotHousekeepers, housekeeperName } from "@/lib/pilot-housekeepers";
import { WorkbenchHeader } from "@/components/workbench/workbench-header";
import { WorkbenchMetrics } from "@/components/workbench/workbench-metrics";
import { WorkbenchFilters } from "@/components/workbench/workbench-filters";
import { OpportunityRow } from "@/components/workbench/opportunity-row";
import { EmptyState } from "@/components/workbench/empty-state";
import { SuggestionSort } from "@/components/suggestion-sort";
import { INBOX_TAB_LABELS, inboxTabFromSearchParams } from "@/lib/labels";
import {
  parseSuggestionSortKey,
  sortSuggestions,
} from "@/lib/suggestion-sorting";
import {
  filterByPriority,
  parsePriorityFilter,
} from "@/lib/priority-filter";
import { HOUSEKEEPER_FILTER_COOKIE } from "@/components/housekeeper-filter";

export const dynamic = "force-dynamic";

export default async function WorkbenchPage({
  searchParams,
}: {
  searchParams: Promise<{ hk?: string; sort?: string; tab?: string; priority?: string }>;
}) {
  const sp = await searchParams;
  const inboxTab = inboxTabFromSearchParams(sp);
  const priorityFilter = parsePriorityFilter(sp.priority);
  const cookieStore = await cookies();
  const hkFromCookie = cookieStore.get(HOUSEKEEPER_FILTER_COOKIE)?.value?.trim();
  const hkFilter = sp.hk?.trim() || hkFromCookie || undefined;
  const pilots = loadPilotHousekeepers();
  const hkOpts = hkFilter ? { housekeeperId: hkFilter } : {};
  const [rawRows, tabCounts] = await Promise.all([
    listSuggestions({ inboxBucket: inboxTab, ...hkOpts }),
    countInboxBuckets(hkOpts),
  ]);
  const sortKey = parseSuggestionSortKey(sp.sort);
  const sorted = sortSuggestions(rawRows, sortKey, pilots);
  const beforePriority = sorted;
  const rows = filterByPriority(sorted, priorityFilter);
  const stats = inboxTab === "active" ? computeStats(beforePriority) : null;
  const displayName = hkFilter
    ? housekeeperName(pilots, hkFilter)
    : "管家";

  return (
    <main className="w-full px-6 py-8 lg:px-8">
      <WorkbenchHeader
        displayName={displayName}
        pendingCount={stats?.pending ?? tabCounts.active}
        pilots={pilots}
        hkFilter={hkFilter}
      />

      <Suspense fallback={null}>
        <WorkbenchFilters
          inboxTab={inboxTab}
          hk={hkFilter}
          tabCounts={tabCounts}
          rows={beforePriority}
          currentPriority={priorityFilter}
        />
      </Suspense>

      {stats ? <WorkbenchMetrics stats={stats} /> : null}

      <div className="mb-3 flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {INBOX_TAB_LABELS[inboxTab]} · {rows.length} 条
          {inboxTab === "active" ? " · 默认按滞留最久" : ""}
        </p>
        <Suspense fallback={null}>
          <SuggestionSort current={sortKey} />
        </Suspense>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={
            hkFilter
              ? `${displayName} · ${INBOX_TAB_LABELS[inboxTab]} 暂无记录`
              : `暂无${INBOX_TAB_LABELS[inboxTab]}`
          }
          description={
            hkFilter
              ? undefined
              : inboxTab === "active" &&
                  tabCounts.archived + tabCounts.closed > 0
                ? `另有 ${tabCounts.archived} 条归档、${tabCounts.closed} 条已处置，请用侧栏或上方标签查看。`
                : "暂无建议。可先运行引擎：FSM_SOURCE=mock LLM_PROVIDER=heuristic python run_cron.py"
          }
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.dedupeKey}>
              <OpportunityRow row={row} pilots={pilots} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
