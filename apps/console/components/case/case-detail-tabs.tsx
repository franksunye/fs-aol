"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { DetailPanel } from "@/lib/workbench-nav";
import { cn } from "@/lib/utils";

const TABS: { id: DetailPanel; label: string }[] = [
  { id: "agent", label: "Agent 分析" },
  { id: "activity", label: "活动时间线" },
];

export function CaseDetailTabs({ active }: { active: DetailPanel }) {
  const pathname = usePathname();
  const sp = useSearchParams();

  function hrefFor(panel: DetailPanel): string {
    const q = new URLSearchParams(sp.toString());
    if (panel === "agent") {
      q.delete("panel");
      q.delete("view");
    } else {
      q.set("panel", "activity");
      q.delete("view");
    }
    const s = q.toString();
    return s ? `${pathname}?${s}` : pathname;
  }

  return (
    <nav
      className="mb-4 flex gap-1 border-b border-border"
      aria-label="案件详情分区"
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={hrefFor(tab.id)}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-foreground border-transparent"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
