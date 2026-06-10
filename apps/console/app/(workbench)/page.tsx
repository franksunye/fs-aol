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
import { WorkbenchTabs } from "@/components/workbench/workbench-tabs";
import { mapFollowUpRow } from "@/lib/adapters/follow-up";
import { OpportunityList } from "@/components/workbench/opportunity-list";
import { WorkbenchSearchBar } from "@/components/workbench/workbench-search-bar";
import { filterSuggestionsByQuery } from "@/lib/workbench-search";
import { EmptyState } from "@/components/workbench/empty-state";
import { INBOX_TAB_LABELS } from "@/lib/labels";
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
import { parseClosedLoopFilter } from "@/lib/action-flow-status";
import { ClosedLoopFilters } from "@/components/workbench/closed-loop-filters";
import {
  inboxBucketForWorkbenchView,
  workbenchViewFromSearchParams,
} from "@/lib/workbench-tabs";
import { shellScrollClass } from "@/lib/shell-preferences";
import { CalendarView } from "@/components/workbench/calendar/calendar-view";
import { ActionFlowHeader } from "@/components/workbench/my-actions/action-flow-header";
import { MyActionsView } from "@/components/workbench/my-actions/my-actions-view";
import { loadActionFlowSummary } from "@/lib/action-flow-metrics";
import {
  countMyActionsPending,
  getMyActionsMockData,
} from "@/lib/my-actions-mock";

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
    panel?: string;
    q?: string;
    action?: string;
    aquick?: string;
    aagent?: string;
    aq?: string;
    cfilter?: string;
  }>;
}) {
  const sp = await searchParams;
  const workbenchView = workbenchViewFromSearchParams({
    tab: sp.tab,
    cfilter: sp.cfilter,
  });
  const isCalendar = workbenchView === "calendar";
  const isActions = workbenchView === "actions";
  const closedLoopFilter = parseClosedLoopFilter(sp.cfilter);
  const inboxBucket = inboxBucketForWorkbenchView(workbenchView, sp.cfilter);
  const isInboxData = inboxBucket !== null;
  const inboxTab = inboxBucket ?? "active";
  const isActiveInbox = inboxTab === "active";
  const isClosedLoop = workbenchView === "closed";
  const priorityFilter = parsePriorityFilter(sp.priority);
  const selectedKey = parseWorkbenchPaneKey(sp.key);
  const cookieStore = await cookies();
  const hkFromCookie = cookieStore.get(HOUSEKEEPER_FILTER_COOKIE)?.value?.trim();
  const hkFilter = sp.hk?.trim() || hkFromCookie || undefined;
  const pilots = loadPilotHousekeepers();
  const hkOpts = hkFilter ? { housekeeperId: hkFilter } : {};
  const actionsCount = countMyActionsPending(getMyActionsMockData());
  const flowSummary = isActions
    ? await loadActionFlowSummary(hkFilter)
    : null;
  const [rawRows, tabCounts] = await Promise.all([
    isInboxData
      ? listSuggestions({ inboxBucket: inboxTab, ...hkOpts })
      : Promise.resolve([]),
    countInboxBuckets(hkOpts),
  ]);
  const sortKey = parseSuggestionSortKey(sp.sort);
  const sorted = sortSuggestions(rawRows, sortKey, pilots);
  const beforePriority = sorted;
  const priorityRows = filterByPriority(sorted, priorityFilter);
  const rows = filterSuggestionsByQuery(priorityRows, sp.q);
  const workItems = rows.map(mapFollowUpRow);
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
    cfilter: sp.cfilter,
  });
  const hasRows = rows.length > 0;

  const listBody = !hasRows ? (
    <EmptyState
      title={
        sp.q?.trim()
          ? `未找到「${sp.q.trim()}」相关工单`
          : hkFilter
            ? `${displayName} · ${INBOX_TAB_LABELS[inboxTab]} 暂无记录`
            : `暂无${INBOX_TAB_LABELS[inboxTab]}`
      }
      description={
        sp.q?.trim()
          ? "尝试工单号或摘要关键词，或清除搜索。"
          : hkFilter
            ? undefined
            : inboxTab === "active" &&
                tabCounts.archived + tabCounts.closed > 0
              ? `另有 ${tabCounts.closed} 条已闭环记录，请切换「已闭环」Tab 查看。`
              : "暂无建议。可先运行引擎：FSM_SOURCE=mock LLM_PROVIDER=heuristic python run_cron.py"
      }
    />
  ) : (
    <div role="listbox" aria-label="机会列表">
      <OpportunityList
        items={workItems}
        listContext={listContext}
        selectedKey={selectedKey}
        sortKey={sortKey}
      />
    </div>
  );

  const listPane = (
    <div className="px-3 py-4 lg:px-4 lg:py-5">
      <WorkbenchHeader pilots={pilots} hkFilter={hkFilter} compact />

      <Suspense fallback={null}>
        <WorkbenchTabs
          current={workbenchView}
          hk={hkFilter}
          counts={tabCounts}
          actionsCount={actionsCount}
        />
      </Suspense>

      <div className="mb-3 md:hidden">
        <Suspense fallback={null}>
          <WorkbenchSearchBar className="max-w-none" />
        </Suspense>
      </div>

      {metrics ? <WorkbenchMetrics metrics={metrics} compact /> : null}

      {isActiveInbox ? (
        <Suspense fallback={null}>
          <WorkbenchFilters
            hk={hkFilter}
            rows={beforePriority}
            currentPriority={priorityFilter}
            compact
          />
        </Suspense>
      ) : isClosedLoop ? (
        <>
          <Suspense fallback={null}>
            <ClosedLoopFilters hk={hkFilter} current={closedLoopFilter} />
          </Suspense>
          <p className="text-muted-foreground mb-4 text-sm">
            {INBOX_TAB_LABELS[inboxTab]} · {rows.length} 条
            {sp.q?.trim() ? ` · 搜索「${sp.q.trim()}」` : ""}
          </p>
        </>
      ) : isInboxData ? (
        <p className="text-muted-foreground mb-4 text-sm">
          {INBOX_TAB_LABELS[inboxTab]} · {rows.length} 条
          {sp.q?.trim() ? ` · 搜索「${sp.q.trim()}」` : ""}
        </p>
      ) : null}

      {listBody}
    </div>
  );

  const detailPane =
    selectedKey && hasRows ? (
      <Suspense key={selectedKey} fallback={<CaseDetailSkeleton />}>
        <CaseDetailPane dedupeKey={selectedKey} searchParams={sp} />
      </Suspense>
    ) : null;

  if (isActions) {
    return (
      <main className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        <div className="shrink-0 px-3 pt-4 lg:px-4 lg:pt-5">
          <WorkbenchHeader pilots={pilots} hkFilter={hkFilter} compact />
          <Suspense fallback={null}>
            <WorkbenchTabs
              current={workbenchView}
              hk={hkFilter}
              counts={tabCounts}
              actionsCount={actionsCount}
            />
          </Suspense>
          {flowSummary ? (
            <ActionFlowHeader summary={flowSummary} hk={hkFilter} />
          ) : null}
        </div>
        <Suspense fallback={null}>
          <MyActionsView hkFilter={hkFilter} pilots={pilots} />
        </Suspense>
      </main>
    );
  }

  if (isCalendar) {
    return (
      <main className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        <div className={`${shellScrollClass} flex-1`}>
          <div className="px-3 py-4 lg:px-4 lg:py-5">
            <WorkbenchHeader pilots={pilots} hkFilter={hkFilter} compact />
            <Suspense fallback={null}>
              <WorkbenchTabs
                current={workbenchView}
                hk={hkFilter}
                counts={tabCounts}
                actionsCount={actionsCount}
              />
            </Suspense>
            <Suspense fallback={null}>
              <CalendarView hkFilter={hkFilter} pilots={pilots} />
            </Suspense>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <WorkbenchSplitLayout
        list={listPane}
        detail={detailPane}
        selectedKey={selectedKey}
      />
    </main>
  );
}
