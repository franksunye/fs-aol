"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Archive,
  BarChart3,
  Calendar,
  CircleHelp,
  Inbox,
  Settings,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

function navHref(path: string, sp: URLSearchParams, hk?: string): string {
  const q = new URLSearchParams(sp.toString());
  if (path.includes("tab=")) {
    const tab = path.split("tab=")[1]?.split("&")[0];
    if (tab) q.set("tab", tab);
    q.delete("priority");
  } else if (path === "/") {
    q.set("tab", "active");
  }
  if (hk) q.set("hk", hk);
  else q.delete("hk");
  const s = q.toString();
  return s ? `/?${s}` : "/";
}

export function SidebarNav({
  activeCount,
  hk,
}: {
  activeCount: number;
  hk?: string;
}) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const tab = sp.get("tab") || "active";
  const onHome = pathname === "/";

  const items = [
    {
      label: "首页",
      icon: Inbox,
      href: navHref("/", sp, hk),
      active: onHome && tab === "active",
      badge: activeCount > 0 ? activeCount : undefined,
    },
    {
      label: "机会",
      icon: Target,
      href: navHref("/", sp, hk),
      active: onHome && tab === "active",
    },
    {
      label: "日历",
      icon: Calendar,
      href: "#",
      disabled: true,
    },
    {
      label: "分析",
      icon: BarChart3,
      href: navHref("/", sp, hk),
      active: onHome && tab === "active",
    },
    {
      label: "归档",
      icon: Archive,
      href: navHref("/?tab=archived", sp, hk),
      active: onHome && tab === "archived",
    },
  ];

  return (
    <aside className="bg-sidebar text-sidebar-foreground flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-5">
        <div className="bg-primary flex size-9 items-center justify-center rounded-lg text-primary-foreground">
          <Sparkles className="size-5" />
        </div>
        <div>
          <div className="text-sm font-semibold">Follow-up Agent</div>
          <div className="text-muted-foreground text-xs">Agent Console</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3" aria-label="主导航">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.disabled) {
            return (
              <span
                key={item.label}
                className="text-muted-foreground flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-50"
                title="v0.4 开放"
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </span>
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                item.active
                  ? "bg-sidebar-accent text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge != null ? (
                <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-sidebar-border p-3">
        <Link
          href="https://github.com/franksunye/fs-aol/blob/main/docs/public/PUB-15-agentic-ui-design.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
        >
          <Settings className="size-4" />
          设置
        </Link>
        <Link
          href="https://github.com/franksunye/fs-aol/blob/main/docs/README.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
        >
          <CircleHelp className="size-4" />
          帮助与反馈
        </Link>
      </div>
    </aside>
  );
}
