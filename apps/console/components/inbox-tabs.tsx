"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { INBOX_TAB_LABELS, type InboxBucket } from "@/lib/labels";

const TABS: InboxBucket[] = ["active", "closed", "archived"];

function buildHref(
  bucket: InboxBucket,
  sp: URLSearchParams,
  hk?: string
): string {
  const q = new URLSearchParams(sp.toString());
  q.set("tab", bucket);
  if (hk) q.set("hk", hk);
  else q.delete("hk");
  const s = q.toString();
  return s ? `/?${s}` : "/";
}

export function InboxTabs({ current, hk }: { current: InboxBucket; hk?: string }) {
  const sp = useSearchParams();
  return (
    <nav
      className="mb-4 flex flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1"
      aria-label="收件箱"
    >
      {TABS.map((tab) => (
        <Link
          key={tab}
          href={buildHref(tab, sp, hk)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === current
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {INBOX_TAB_LABELS[tab]}
        </Link>
      ))}
    </nav>
  );
}
