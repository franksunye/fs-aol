import type { ListBadge } from "../list-display";
import type { WorkItem } from "../operator-model";

/** 窄屏列表补充 badge（桌面列已展示 Agent / 关联对象 / 状态） */
export function followUpListBadges(item: WorkItem): ListBadge[] {
  const d = item.listDisplay;
  if (!d) return [];

  const badges: ListBadge[] = [
    {
      key: "agent",
      label: d.sourceAgent.label,
      variant: "outline",
    },
    {
      key: "related",
      label: `${d.relatedObject.type} ${d.relatedObject.id}`,
      variant: "outline",
    },
    {
      key: "status",
      label: d.statusLabel,
      variant: "secondary",
    },
  ];

  const ctx = d.contextColumn?.facets?.[0];
  if (ctx) {
    badges.splice(2, 0, {
      key: "context",
      label: `${ctx.label} ${ctx.value}`,
      variant: "outline",
    });
  }

  if (d.executorLabel && d.executorLabel !== "—") {
    badges.push({
      key: "executor",
      label: d.executorLabel,
      variant: "secondary",
    });
  }

  return badges;
}
