import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loadActionCenterPageData } from "@/lib/data";
import {
  parseDataListPage,
  parseDataListPageSize,
} from "@/components/data-list/data-list-types";
import { loadPilotHousekeepers, housekeeperName } from "@/lib/pilot-housekeepers";
import { ActionReviewFilters } from "@/components/action-center/action-review-filters";
import { mapFollowUpRow } from "@/lib/adapters/follow-up";
import { ActionReviewList } from "@/components/action-center/action-review-list";
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
import type { SuggestionRow } from "@/lib/suggestions";
import type { ClosedLoopFilter } from "@/lib/execution-status";
import {
  buildFlowSecondaryMetrics,
  buildReviewSecondaryMetrics,
} from "@/lib/action-center-secondary";
import { ActionCenterShell } from "@/components/action-center/action-center-shell";
import { ActionCenterSecondaryStrip } from "@/components/action-center/action-center-secondary-strip";
import { ActionReviewListSkeleton } from "@/components/action-center/action-center-skeleton";
import { ExecutionToolbar } from "@/components/action-center/execution-toolbar";
export const dynamic = "force-dynamic";

function filterClosedLoopRows(
  rows: SuggestionRow[],
  filter: ClosedLoopFilter
): SuggestionRow[] {
  if (filter === "all") return rows;
  if (filter === "archived") {
    return rows.filter((r) => r.inboxBucket === "archived");
  }
  if (filter === "rejected") {
    return rows.filter((r) => r.outcome?.decision === "rejected");
  }
  if (filter === "completed") {
    return rows.filter((r) =>
      ["approved", "modified", "followed_up"].includes(
        r.outcome?.decision ?? ""
      )
    );
  }
  if (filter === "expired") {
    return rows.filter(
      (r) =>
        r.archiveReason === "left_wedge" ||
        r.archiveReason === "mongo_missing" ||
        r.archiveReason === "agent_no_follow"
    );
  }
  return rows;
}

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
    page?: string;
    pageSize?: string;
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
  const sortKey = parseActionReviewSortKey(sp.sort);
  const listPage = parseDataListPage(sp.page);
  const listPageSize = parseDataListPageSize(sp.pageSize);
  const canDbPaginate =
    isInboxData &&
    sortKey === "latest" &&
    !sp.q?.trim() &&
    !priorityFilter;

  const {
    primaryKpis,
    flowSummary,
    tabCounts,
    executionCount,
    executionActions,
    inboxPageResult,
    metricsRawRows,
    activeReviewMetrics,
    priorityFilterCounts,
    runtimeConfig,
  } = await loadActionCenterPageData({
    housekeeperId: hkFilter,
    isExecution,
    inboxTab,
    isInboxData,
    isActiveInbox,
    canDbPaginate,
    listPage,
    listPageSize,
  });

  const rawRows =
    canDbPaginate && inboxPageResult
      ? inboxPageResult.rows
      : metricsRawRows;

  const sorted = sortActionReviews(rawRows, sortKey, pilots);
  const beforePriority = sortActionReviews(metricsRawRows, sortKey, pilots);
  const priorityRows = filterByPriority(sorted, priorityFilter);
  const closedFiltered =
    isClosedLoop && closedLoopFilter !== "all"
      ? filterClosedLoopRows(priorityRows, closedLoopFilter)
      : priorityRows;
  const filteredRows = filterActionReviewsByQuery(closedFiltered, sp.q);

  const listTotal =
    canDbPaginate && inboxPageResult
      ? inboxPageResult.total
      : filteredRows.length;

  const pageRows =
    canDbPaginate && inboxPageResult
      ? filteredRows
      : filteredRows.slice(
          (listPage - 1) * listPageSize,
          listPage * listPageSize
        );

  const followUpCtx = {
    bindingOverrides: runtimeConfig?.runtime.config.binding_overrides,
  };
  const workItems = pageRows.map((row) => mapFollowUpRow(row, followUpCtx));
  const metrics =
    isActiveInbox && activeReviewMetrics
      ? activeReviewMetrics
      : isActiveInbox
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
  const hasRows = listTotal > 0;

  const secondaryStrip = isExecution ? (
    <ActionCenterSecondaryStrip
      compact
      title="流转状态"
      items={buildFlowSecondaryMetrics(flowSummary, hkFilter, {
        status: sp.astatus,
        quick: sp.aquick,
      })}
      trailing={<ExecutionToolbar hk={hkFilter} />}
    />
  ) : isActiveInbox && metrics ? (
    <ActionCenterSecondaryStrip
      compact
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
    <div
      role="listbox"
      aria-label="Action 列表"
      className="flex h-full min-h-0 flex-col"
    >
      <Suspense fallback={<ActionReviewListSkeleton />}>
        <ActionReviewList
          items={workItems}
          totalCount={listTotal}
          listContext={listContext}
          selectedKey={selectedKey}
          sortKey={sortKey}
          layout={selectedKey ? "narrow" : "wide"}
          toolbarStart={
            isActiveInbox ? (
              <Suspense fallback={null}>
                <ActionReviewFilters
                  hk={hkFilter}
                  rows={priorityFilterCounts ? undefined : beforePriority}
                  priorityCounts={priorityFilterCounts ?? undefined}
                  currentPriority={priorityFilter}
                  compact
                  embedded
                />
              </Suspense>
            ) : isClosedLoop ? (
              <Suspense fallback={null}>
                <ClosedLoopFilters
                  hk={hkFilter}
                  current={closedLoopFilter}
                  embedded
                />
              </Suspense>
            ) : undefined
          }
        />
      </Suspense>
    </div>
  );

  const listPane = (
    <div
      className={
        hasRows
          ? "flex h-full min-h-0 flex-col px-3 pb-3 pt-0 lg:px-4 lg:pb-4"
          : "flex h-full min-h-0 flex-col px-3 py-3 lg:px-4 lg:py-4"
      }
    >
      <div className="shrink-0">
        {!hasRows && isActiveInbox ? (
          <Suspense fallback={null}>
            <ActionReviewFilters
              hk={hkFilter}
              rows={priorityFilterCounts ? undefined : beforePriority}
              priorityCounts={priorityFilterCounts ?? undefined}
              currentPriority={priorityFilter}
              compact
            />
          </Suspense>
        ) : !hasRows && isClosedLoop ? (
          <Suspense fallback={null}>
            <ClosedLoopFilters hk={hkFilter} current={closedLoopFilter} />
          </Suspense>
        ) : null}
      </div>

      <div className="min-h-0 flex-1">{listBody}</div>
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
          <ActionExecutionView
            hkFilter={hkFilter}
            pilots={pilots}
            actions={executionActions}
          />
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
