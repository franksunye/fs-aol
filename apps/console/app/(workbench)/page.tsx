import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  listSuggestions,
  countInboxBuckets,
} from "@/lib/suggestions";
import { loadPilotHousekeepers, housekeeperName } from "@/lib/pilot-housekeepers";
import { WorkbenchFilters } from "@/components/workbench/workbench-filters";
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
import { calendarHref } from "@/lib/calendar-nav";
import { MyActionsView } from "@/components/workbench/my-actions/my-actions-view";
import {
  countMyActionsPending,
  getMyActionsMockData,
} from "@/lib/my-actions-mock";
import { loadActionCenterPrimaryKpis } from "@/lib/action-center-metrics";
import { loadActionFlowSummary } from "@/lib/action-flow-metrics";
import {
  buildFlowSecondaryMetrics,
  buildReviewSecondaryMetrics,
} from "@/lib/action-center-secondary";
import { ActionCenterShell } from "@/components/workbench/action-center/action-center-shell";
import { ActionCenterSecondaryStrip } from "@/components/workbench/action-center/action-center-secondary-strip";
import { ActionFlowTabToolbar } from "@/components/workbench/action-center/action-flow-tab-toolbar";
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
    astatus?: string;
    cfilter?: string;
  }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const hkFromCookie = cookieStore.get(HOUSEKEEPER_FILTER_COOKIE)?.value?.trim();
  const hkFilter = sp.hk?.trim() || hkFromCookie || undefined;

  if (sp.tab?.trim() === "calendar") {
    redirect(calendarHref(hkFilter));
  }

  const workbenchView = workbenchViewFromSearchParams({
    tab: sp.tab,
    cfilter: sp.cfilter,
  });
  const isActions = workbenchView === "actions";
  const closedLoopFilter = parseClosedLoopFilter(sp.cfilter);
  const inboxBucket = inboxBucketForWorkbenchView(workbenchView, sp.cfilter);
  const isInboxData = inboxBucket !== null;
  const inboxTab = inboxBucket ?? "active";
  const isActiveInbox = inboxTab === "active";
  const isClosedLoop = workbenchView === "closed";
  const priorityFilter = parsePriorityFilter(sp.priority);
  const selectedKey = parseWorkbenchPaneKey(sp.key);
  const pilots = loadPilotHousekeepers();
  const hkOpts = hkFilter ? { housekeeperId: hkFilter } : {};
  const actionsCount = countMyActionsPending(getMyActionsMockData());

  const [primaryKpis, flowSummary, rawRows, tabCounts] = await Promise.all([
    loadActionCenterPrimaryKpis(hkFilter),
    loadActionFlowSummary(hkFilter),
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

  const secondaryStrip = isActions ? (
    <ActionCenterSecondaryStrip
      title="流转状态"
      items={buildFlowSecondaryMetrics(flowSummary, hkFilter, {
        status: sp.astatus,
        quick: sp.aquick,
      })}
      trailing={<ActionFlowTabToolbar hk={hkFilter} />}
    />
  ) : isActiveInbox && metrics ? (
    <ActionCenterSecondaryStrip
      title="待审核"
      items={buildReviewSecondaryMetrics(metrics, hkFilter, sp.priority)}
    />
  ) : null;

  const shellProps = {
    pilots,
    hkFilter,
    workbenchView,
    tabCounts,
    actionsCount,
    primaryKpis,
    secondary: secondaryStrip,
  };

  const listBody = !hasRows ? (
    <EmptyState
      title={
        sp.q?.trim()
          ? `未找到「${sp.q.trim()}」相关 Action`
          : hkFilter
            ? `${displayName} · ${INBOX_TAB_LABELS[inboxTab]} 暂无记录`
            : `暂无${INBOX_TAB_LABELS[inboxTab]}`
      }
      description={
        sp.q?.trim()
          ? "尝试 Action 标题、关联对象 ID 或摘要关键词，或清除搜索。"
          : hkFilter
            ? undefined
            : inboxTab === "active" &&
                tabCounts.archived + tabCounts.closed > 0
              ? `另有 ${tabCounts.closed} 条已闭环记录，请切换「已闭环」Tab 查看。`
              : "暂无建议。可先运行引擎：FSM_SOURCE=mock LLM_PROVIDER=heuristic python run_cron.py"
      }
    />
  ) : (
    <div role="listbox" aria-label="Action 列表">
      <OpportunityList
        items={workItems}
        listContext={listContext}
        selectedKey={selectedKey}
        sortKey={sortKey}
      />
    </div>
  );

  const listPane = (
    <div className="px-3 py-3 lg:px-4 lg:py-4">
      <div className="mb-3 md:hidden">
        <Suspense fallback={null}>
          <WorkbenchSearchBar className="max-w-none" />
        </Suspense>
      </div>

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
      <ActionCenterShell {...shellProps}>
        <Suspense fallback={null}>
          <MyActionsView hkFilter={hkFilter} pilots={pilots} />
        </Suspense>
      </ActionCenterShell>
    );
  }

  return (
    <ActionCenterShell {...shellProps}>
      <WorkbenchSplitLayout
        list={listPane}
        detail={detailPane}
        selectedKey={selectedKey}
      />
    </ActionCenterShell>
  );
}
