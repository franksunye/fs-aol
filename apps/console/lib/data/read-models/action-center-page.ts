import { cache } from "react";
import type { ExecutionAction } from "@/lib/action-execution-mock";
import type { ExecutionMetricsResult } from "@/lib/execution-metrics";
import { executionMetricsFromFlow } from "@/lib/execution-metrics";
import {
  resolveActionCenterPrimaryKpis,
  type ActionCenterPrimaryKpi,
} from "@/lib/action-center-metrics";
import { getRuntimeConfigForUi } from "@/lib/runtime-config/store";
import { listExecutionActions } from "@/lib/tracking/actions";
import {
  listSuggestions,
  listSuggestionsPage,
} from "@/lib/tracking/inbox";
import type { InboxBucket } from "@/lib/labels";
import type { InboxBucketCounts, SuggestionRow } from "@/lib/tracking/types";
import { loadWorkbenchShellSnapshot } from "./workbench-shell";

export type ActionCenterPageQuery = {
  housekeeperId?: string;
  isExecution: boolean;
  inboxTab: InboxBucket;
  isInboxData: boolean;
  isActiveInbox: boolean;
  canDbPaginate: boolean;
  listPage: number;
  listPageSize: number;
};

export type ActionCenterPageData = {
  primaryKpis: ActionCenterPrimaryKpi[];
  flowSummary: ExecutionMetricsResult;
  tabCounts: InboxBucketCounts;
  executionCount: number;
  executionActions: ExecutionAction[];
  inboxPageResult: Awaited<ReturnType<typeof listSuggestionsPage>> | null;
  metricsRawRows: SuggestionRow[];
  runtimeConfig: Awaited<ReturnType<typeof getRuntimeConfigForUi>>;
};

async function loadActionCenterPageDataUncached(
  query: ActionCenterPageQuery
): Promise<ActionCenterPageData> {
  const hk = query.housekeeperId;
  const shell = await loadWorkbenchShellSnapshot(hk);
  const flowSummary = executionMetricsFromFlow(shell.flow);
  const primaryKpis = resolveActionCenterPrimaryKpis(
    shell.buckets,
    shell.pendingExecution,
    flowSummary
  );

  const hkOpts = hk ? { housekeeperId: hk } : {};
  const needsMetricsRows =
    query.isInboxData && (!query.canDbPaginate || query.isActiveInbox);

  const [inboxPageResult, metricsRawRows, runtimeConfig, executionActions] =
    await Promise.all([
      query.canDbPaginate
        ? listSuggestionsPage({
            inboxBucket: query.inboxTab,
            ...hkOpts,
            page: query.listPage,
            pageSize: query.listPageSize,
          })
        : Promise.resolve(null),
      needsMetricsRows
        ? listSuggestions({
            inboxBucket: query.inboxTab,
            ...hkOpts,
            limit: 500,
          })
        : Promise.resolve([]),
      getRuntimeConfigForUi(),
      query.isExecution
        ? listExecutionActions(hkOpts)
        : Promise.resolve([] as ExecutionAction[]),
    ]);

  return {
    primaryKpis,
    flowSummary,
    tabCounts: shell.buckets,
    executionCount: shell.pendingExecution,
    executionActions,
    inboxPageResult,
    metricsRawRows,
    runtimeConfig,
  };
}

type PageQueryKey = string;

function pageQueryKey(query: ActionCenterPageQuery): PageQueryKey {
  return [
    query.housekeeperId ?? "",
    query.isExecution ? "1" : "0",
    query.inboxTab,
    query.isInboxData ? "1" : "0",
    query.isActiveInbox ? "1" : "0",
    query.canDbPaginate ? "1" : "0",
    query.listPage,
    query.listPageSize,
  ].join("|");
}

const pageDataCache = cache(
  async (_key: PageQueryKey, query: ActionCenterPageQuery) =>
    loadActionCenterPageDataUncached(query)
);

/** Actions 页数据：复用 layout 的 WorkbenchShellSnapshot，并行拉列表与配置。 */
export async function loadActionCenterPageData(
  query: ActionCenterPageQuery
): Promise<ActionCenterPageData> {
  return pageDataCache(pageQueryKey(query), query);
}
