import { decisionClasses } from "../labels";
import type { ListBadge } from "../list-display";
import type { WorkItem } from "../operator-model";
import { AGENT_STATUS_LABELS } from "../agent-status";

/** 列表行 badge（最多 3 个可见，其余由 BadgeStack 折叠） */
export function followUpListBadges(item: WorkItem): ListBadge[] {
  const d = item.listDisplay;
  if (!d) return [];

  const badges: ListBadge[] = [
    {
      key: "stage",
      label: d.stageLabel,
      variant: "outline",
    },
  ];

  if (d.staleDays != null) {
    badges.push({
      key: "stale",
      label: `停滞 ${d.staleDays}d`,
      variant: "outline",
    });
  }

  if (d.quoteBadge) {
    badges.push({
      key: "quote",
      label: d.quoteBadge,
      className: "bg-violet-50 text-violet-700 border-violet-100",
    });
  }

  badges.push({
    key: "agent",
    label: AGENT_STATUS_LABELS[d.agentStatus],
    variant: "secondary",
  });

  if (item.disposition?.decision) {
    badges.push({
      key: "disposition",
      label: d.dispositionLabel,
      className: decisionClasses(item.disposition.decision),
    });
  }

  return badges;
}
