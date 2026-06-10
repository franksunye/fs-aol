import { notFound } from "next/navigation";
import { getSuggestion, listTracesLite } from "@/lib/suggestions";
import { getTimelineEvents } from "@/lib/timeline";
import { encodeKey } from "@/lib/labels";
import { buildTimelineRoundLinks, parseAgentRound } from "@/lib/agent-rounds";
import {
  parseDetailPanel,
  actionReviewListContext,
  actionReviewPaneDetailHref,
} from "@/lib/action-center-nav";
import { CaseDetailView } from "@/components/case/case-detail-view";

export async function CaseDetailPane({
  dedupeKey,
  searchParams,
}: {
  dedupeKey: string;
  searchParams: {
    tab?: string;
    hk?: string;
    sort?: string;
    priority?: string;
    round?: string;
    view?: string;
    panel?: string;
  };
}) {
  const row = await getSuggestion(dedupeKey);
  if (!row) notFound();

  const listContext = actionReviewListContext(searchParams);
  const [timelineEvents, traces] = await Promise.all([
    getTimelineEvents(row.workOrderId),
    listTracesLite(row.workOrderId),
  ]);

  const initialRound = parseAgentRound(searchParams.round, traces.length);
  const roundLinksMap = buildTimelineRoundLinks(timelineEvents, traces);
  const roundLinks: Record<number, number> = {};
  roundLinksMap.forEach((v, k) => {
    roundLinks[k] = v;
  });

  const detailBase = actionReviewPaneDetailHref(row.dedupeKey, listContext);

  return (
    <CaseDetailView
      row={row}
      timelineEvents={timelineEvents}
      initialRound={initialRound}
      roundLinks={roundLinks}
      detailBase={detailBase}
      panel={parseDetailPanel(searchParams.panel, searchParams.view)}
      variant="pane"
    />
  );
}

export function parseActionReviewPaneKey(raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  try {
    return decodeURIComponent(raw.trim());
  } catch {
    return raw.trim();
  }
}

export function encodeActionReviewPaneKey(dedupeKey: string): string {
  return encodeKey(dedupeKey);
}
