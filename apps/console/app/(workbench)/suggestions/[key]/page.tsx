import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSuggestion, listTracesLite } from "@/lib/suggestions";
import { getTimelineEvents } from "@/lib/timeline";
import { CaseDetailView } from "@/components/case/case-detail-view";
import { encodeKey } from "@/lib/labels";
import { buildTimelineRoundLinks, parseAgentRound } from "@/lib/agent-rounds";
import {
  detailHrefWithListContext,
  listContextFromDetailSearchParams,
  parseDetailPanel,
  resolveWorkbenchBack,
} from "@/lib/workbench-nav";

export const dynamic = "force-dynamic";

/** 独立详情页：深链 / 企微入口；工作台列表默认走 /?key= 分栏浏览 */
export default async function SuggestionDetail({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{
    tab?: string;
    round?: string;
    view?: string;
    panel?: string;
    from?: string;
    hk?: string;
    sort?: string;
    priority?: string;
  }>;
}) {
  const { key } = await params;
  const sp = await searchParams;
  const dedupeKey = decodeURIComponent(key);
  const row = await getSuggestion(dedupeKey);
  if (!row) notFound();

  const [timelineEvents, traces] = await Promise.all([
    getTimelineEvents(row.workOrderId),
    listTracesLite(row.workOrderId),
  ]);

  const initialRound = parseAgentRound(sp.round, traces.length);
  const roundLinksMap = buildTimelineRoundLinks(timelineEvents, traces);
  const roundLinks: Record<number, number> = {};
  roundLinksMap.forEach((v, k) => {
    roundLinks[k] = v;
  });

  const listContext = listContextFromDetailSearchParams(sp);
  const detailPath = `/suggestions/${encodeKey(dedupeKey)}`;
  const detailBase = detailHrefWithListContext(detailPath, listContext);
  const back = resolveWorkbenchBack(sp, row.inboxBucket);

  return (
    <main className="mx-auto w-full max-w-[1400px]">
      <Link
        href={back.href}
        className="text-muted-foreground hover:text-foreground mx-6 mb-4 mt-6 inline-flex items-center gap-1 text-sm lg:mx-8"
      >
        <ArrowLeft className="h-4 w-4" /> {back.label}
      </Link>
      <CaseDetailView
        row={row}
        timelineEvents={timelineEvents}
        initialRound={initialRound}
        roundLinks={roundLinks}
        detailBase={detailBase}
        panel={parseDetailPanel(sp.panel, sp.view)}
        variant="page"
      />
    </main>
  );
}
