import type { ListBadge } from "../list-display";
import type { WorkItem } from "../operator-model";

/** 窄屏列表补充 badge（桌面列已展示部位/管家，此处避免 Agent/处置重复） */
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

  if (d.partLabel && d.partLabel !== "—") {
    badges.push({
      key: "part",
      label: d.partLabel,
      variant: "outline",
    });
  }

  if (d.assigneeLabel && d.assigneeLabel !== "—") {
    badges.push({
      key: "assignee",
      label: d.assigneeLabel,
      variant: "secondary",
    });
  }

  return badges;
}
