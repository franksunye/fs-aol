import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  listSuggestions,
  countInboxBuckets,
} from "@/lib/suggestions";
import { loadPilotHousekeepers, housekeeperName } from "@/lib/pilot-housekeepers";
import { ActionReviewFilters } from "@/components/action-center/action-review-filters";
import { mapFollowUpRow } from "@/lib/adapters/follow-up";
import { ActionReviewList } from "@/components/action-center/action-review-list";
import { ActionReviewSearchBar } from "@/components/action-center/action-review-search-bar";
import { filterActionReviewsByQuery } from "@/lib/action-review-search";
import { EmptyState } from "@/components/action-center/empty-state";
import { INBOX_TAB_LABELS } from "@/lib/labels";
import {
  parseActionReviewSortKey,
  sortActionReviews,
} from "@/lib/action-review-sorting";
import {
  filterByPriority,
  parsePriorityFilter,
} from "@/lib/priority-filter";
import { computeActionReviewMetricCards } from "@/lib/action-review-metric-cards";
import { HOUSEKEEPER_FILTER_COOKIE } from "@/components/housekeeper-filter";
import { actionReviewListContext } from "@/lib/action-center-nav";
import { ActionReviewSplitLayout } from "@/components/action-center/action-review-split-layout";
import {
  CaseDetailPane,
  parseActionReviewPaneKey,
} from "@/components/action-center/case-detail-pane";
import { CaseDetailSkeleton } from "@/components/action-center/case-detail-skeleton";
import { parseClosedLoopFilter } from "@/lib/execution-status";
import { ClosedLoopFilters } from "@/components/action-center/closed-loop-filters";
import {
  inboxBucketForActionCenterView,
  actionCenterViewFromSearchParams,
} from "@/lib/action-center-tabs";
import { calendarHref } from "@/lib/calendar-nav";
import { ActionExecutionView } from "@/components/action-center/execution/action-execution-view";
import {
  countExecutionActionsPending,
  getExecutionActionsMockData,
} from "@/lib/action-execution-mock";
import { loadActionCenterPrimaryKpis } from "@/lib/action-center-metrics";
import { loadExecutionMetrics } from "@/lib/execution-metrics";
import {
  buildFlowSecondaryMetrics,
  buildReviewSecondaryMetrics,
} from "@/lib/action-center-secondary";
import { ActionCenterShell } from "@/components/action-center/action-center-shell";
import { ActionCenterSecondaryStrip } from "@/components/action-center/action-center-secondary-strip";
import { ExecutionToolbar } from "@/components/action-center/execution-toolbar";
export const dynamic = "force-dynamic";

export default async function ActionCenterPage({
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

  const actionCenterView = actionCenterViewFromSearchParams({
    tab: sp.tab,
    cfilter: sp.cfilter,
  });
  const isExecution = actionCenterView === "execution";
  const closedLoopFilter = parseClosedLoopFilter(sp.cfilter);
  const inboxBucket = inboxBucketForActionCenterView(actionCenterView, sp.cfilter);
  const isInboxData = inboxBucket !== null;
  const inboxTab = inboxBucket ?? "active";
  const isActiveInbox = inboxTab === "active";
  const isClosedLoop = actionCenterView === "closed";
  const priorityFilter = parsePriorityFilter(sp.priority);
  const selectedKey = parseActionReviewPaneKey(sp.key);
  const pilots = loadPilotHousekeepers();
  const hkOpts = hkFilter ? { housekeeperId: hkFilter } : {};
  const executionCount = countExecutionActionsPending(getExecutionActionsMockData());

  const [primaryKpis, flowSummary, rawRows, tabCounts] = await Promise.all([
    loadActionCenterPrimaryKpis(hkFilter),
    loadExecutionMetrics(hkFilter),
    isInboxData
      ? listSuggestions({ inboxBucket: inboxTab, ...hkOpts })
      : Promise.resolve([]),
    countInboxBuckets(hkOpts),
  ]);

  const sortKey = parseActionReviewSortKey(sp.sort);
  const sorted = sortActionReviews(rawRows, sortKey, pilots);
  const beforePriority = sorted;
  const priorityRows = filterByPriority(sorted, priorityFilter);
  const rows = filterActionReviewsByQuery(priorityRows, sp.q);
  const workItems = rows.map(mapFollowUpRow);
  const metrics = isActiveInbox
    ? computeActionReviewMetricCards(beforePriority)
    : null;
  const displayName = hkFilter
    ? housekeeperName(pilots, hkFilter)
    : "管家";
  const listContext = actionReviewListContext({
    tab: sp.tab,
    hk: hkFilter,
    sort: sp.sort,
    priority: sp.priority,
    cfilter: sp.cfilter,
  });
  const hasRows = rows.length > 0;

  const secondaryStrip = isExecution ? (
    <ActionCenterSecondaryStrip
      title="流转状态"
      items={buildFlowSecondaryMetrics(flowSummary, hkFilter, {
        status: sp.astatus,
        quick: sp.aquick,
      })}
      trailing={<ExecutionToolbar hk={hkFilter} />}
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
    actionCenterView,
    tabCounts,
    executionCount,
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
      <ActionReviewList
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
          <ActionReviewSearchBar className="max-w-none" />
        </Suspense>
      </div>

      {isActiveInbox ? (
        <Suspense fallback={null}>
          <ActionReviewFilters
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

  if (isExecution) {
    return (
      <ActionCenterShell {...shellProps}>
        <Suspense fallback={null}>
          <ActionExecutionView hkFilter={hkFilter} pilots={pilots} />
        </Suspense>
      </ActionCenterShell>
    );
  }

  return (
    <ActionCenterShell {...shellProps}>
      <ActionReviewSplitLayout
        list={listPane}
        detail={detailPane}
        selectedKey={selectedKey}
      />
    </ActionCenterShell>
  );
}
