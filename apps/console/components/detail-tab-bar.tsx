import Link from "next/link";
import { cn } from "@/lib/utils";

export function DetailTabBar({
  baseHref,
  active,
  analysisCount,
}: {
  baseHref: string;
  active: "agent" | "timeline";
  analysisCount: number;
}) {
  const tabs: { id: "agent" | "timeline"; label: string; href: string }[] = [
    {
      id: "agent",
      label:
        analysisCount > 1
          ? `Agent 分析（${analysisCount} 次）`
          : "Agent 分析",
      href: `${baseHref}?tab=agent`,
    },
    {
      id: "timeline",
      label: "业务时间轴",
      href: `${baseHref}?tab=timeline`,
    },
  ];

  return (
    <div className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className={cn(
            "inline-flex h-[calc(100%-1px)] items-center justify-center rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors",
            active === t.id
              ? "bg-background text-foreground shadow-sm"
              : "hover:text-foreground"
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
