import { Suspense } from "react";
import { cookies } from "next/headers";
import {
  listSuggestions,
  countInboxBuckets,
} from "@/lib/suggestions";
import { loadPilotHousekeepers, housekeeperName } from "@/lib/pilot-housekeepers";
import { WorkbenchHeader } from "@/components/workbench/workbench-header";
import { WorkbenchMetrics } from "@/components/workbench/workbench-metrics";
import { WorkbenchFilters } from "@/components/workbench/workbench-filters";
import { OpportunityRow } from "@/components/workbench/opportunity-row";
import { EmptyState } from "@/components/workbench/empty-state";
import { INBOX_TAB_LABELS, inboxTabFromSearchParams } from "@/lib/labels";
import {
  parseSuggestionSortKey,
  sortSuggestions,
} from "@/lib/suggestion-sorting";
import {
  filterByPriority,
  parsePriorityFilter,
} from "@/lib/priority-filter";
import { computeWorkbenchMetricCards } from "@/lib/workbench-metrics";
import { HOUSEKEEPER_FILTER_COOKIE } from "@/components/housekeeper-filter";
import { workbenchListContextFromWorkbench } from "@/lib/workbench-nav";
import { WorkbenchSplitLayout } from "@/components/workbench/workbench-split-layout";
import {
  CaseDetailPane,
  parseWorkbenchPaneKey,
} from "@/components/workbench/case-detail-pane";
import { CaseDetailSkeleton } from "@/components/workbench/case-detail-skeleton";

export const dynamic = "force-dynamic";

export default async function WorkbenchPage({
  searchParams,
}: {
  searchParams: Promise<{
    hk?: string;
    sort?: string;
    tab?: string;
    priority?: string;
    key?: string;
    round?: string;
    view?: string;
  }>;
}) {
  const sp = await searchParams;
  const inboxTab = inboxTabFromSearchParams(sp);
  const isActiveInbox = inboxTab === "active";
  const priorityFilter = parsePriorityFilter(sp.priority);
  const selectedKey = parseWorkbenchPaneKey(sp.key);
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
  const metrics = isActiveInbox
    ? computeWorkbenchMetricCards(beforePriority)
    : null;
  const displayName = hkFilter
    ? housekeeperName(pilots, hkFilter)
    : "管家";
  const listContext = workbenchListContextFromWorkbench({
    tab: sp.tab,
    hk: hkFilter,
    sort: sp.sort,
    priority: sp.priority,
  });
  const hasRows = rows.length > 0;

  const listPane = (
    <div className="px-4 py-6 lg:px-5 lg:py-6">
      <WorkbenchHeader
        displayName={displayName}
        pendingCount={metrics?.pending ?? tabCounts.active}
        pilots={pilots}
        hkFilter={hkFilter}
      />

      {metrics ? <WorkbenchMetrics metrics={metrics} /> : null}

      {isActiveInbox ? (
        <Suspense fallback={null}>
          <WorkbenchFilters
            hk={hkFilter}
            rows={beforePriority}
            currentPriority={priorityFilter}
            sortKey={sortKey}
          />
        </Suspense>
      ) : (
        <p className="text-muted-foreground mb-4 text-sm">
          {INBOX_TAB_LABELS[inboxTab]} · {rows.length} 条
        </p>
      )}

      {!hasRows ? (
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
                ? `另有 ${tabCounts.archived} 条归档、${tabCounts.closed} 条已处置，请用侧栏查看。`
                : "暂无建议。可先运行引擎：FSM_SOURCE=mock LLM_PROVIDER=heuristic python run_cron.py"
          }
        />
      ) : (
        <ul className="space-y-2" role="listbox" aria-label="机会列表">
          {rows.map((row) => (
            <li key={row.dedupeKey} role="option" aria-selected={selectedKey === row.dedupeKey}>
              <OpportunityRow
                row={row}
                listContext={listContext}
                selected={selectedKey === row.dedupeKey}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const detailPane =
    selectedKey && hasRows ? (
      <Suspense key={selectedKey} fallback={<CaseDetailSkeleton />}>
        <CaseDetailPane dedupeKey={selectedKey} searchParams={sp} />
      </Suspense>
    ) : null;

  return (
    <main className="flex min-h-0 w-full flex-1 flex-col">
      <WorkbenchSplitLayout
        list={listPane}
        detail={detailPane}
        selectedKey={selectedKey}
        showPlaceholder={hasRows}
      />
    </main>
  );
}
