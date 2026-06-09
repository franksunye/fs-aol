"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  BarChart3,
  Calendar,
  CheckCircle2,
  CircleHelp,
  Inbox,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { stripPaneSelectionParams } from "@/lib/workbench-nav";
import { Button } from "@/components/ui/button";

function navHref(path: string, sp: URLSearchParams, hk?: string): string {
  const q = new URLSearchParams(sp.toString());
  stripPaneSelectionParams(q);
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

function analyticsHref(sp: URLSearchParams, hk?: string): string {
  const q = new URLSearchParams();
  const range = sp.get("range");
  if (range) q.set("range", range);
  if (hk) q.set("hk", hk);
  const s = q.toString();
  return s ? `/analytics?${s}` : "/analytics";
}

type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
  badge?: number;
  disabled?: boolean;
};

export function SidebarNav({
  activeCount,
  closedCount,
  hk,
  collapsed = false,
  onToggleCollapsed,
}: {
  activeCount: number;
  closedCount?: number;
  hk?: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const tab = sp.get("tab") || "active";
  const onHome = pathname === "/";
  const onAnalytics = pathname === "/analytics";

  const items: NavItem[] = [
    {
      label: "首页",
      icon: Inbox,
      href: navHref("/", sp, hk),
      active: onHome && tab === "active",
      badge: activeCount > 0 ? activeCount : undefined,
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
      href: analyticsHref(sp, hk),
      active: onAnalytics,
    },
    {
      label: "已处置",
      icon: CheckCircle2,
      href: navHref("/?tab=closed", sp, hk),
      active: onHome && tab === "closed",
      badge: closedCount && closedCount > 0 ? closedCount : undefined,
    },
    {
      label: "归档",
      icon: Archive,
      href: navHref("/?tab=archived", sp, hk),
      active: onHome && tab === "archived",
    },
  ];

  const footerLinks = [
    {
      label: "设置",
      icon: Settings,
      href: "https://github.com/franksunye/fs-aol/blob/main/docs/public/PUB-15-agentic-ui-design.md",
    },
    {
      label: "帮助与反馈",
      icon: CircleHelp,
      href: "https://github.com/franksunye/fs-aol/blob/main/docs/README.md",
    },
  ];

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground flex h-full w-full flex-col border-r border-sidebar-border"
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border transition-all duration-200",
          collapsed ? "justify-center px-2 py-4" : "gap-2 px-4 py-5"
        )}
      >
        <div className="bg-primary flex size-9 shrink-0 items-center justify-center rounded-lg text-primary-foreground">
          <Sparkles className="size-5" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">Follow-up Agent</div>
            <div className="text-muted-foreground truncate text-xs">Agent Console</div>
          </div>
        ) : null}
      </div>

      <nav
        className={cn("flex-1 space-y-0.5", collapsed ? "p-2" : "p-3")}
        aria-label="主导航"
      >
        {items.map((item) => (
          <SidebarNavItem key={item.label} item={item} collapsed={collapsed} />
        ))}
      </nav>

      <div
        className={cn(
          "space-y-0.5 border-t border-sidebar-border",
          collapsed ? "p-2" : "p-3"
        )}
      >
        {footerLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title={collapsed ? link.label : undefined}
              className={cn(
                "text-muted-foreground hover:text-foreground flex items-center rounded-lg text-sm transition-colors hover:bg-sidebar-accent/60",
                collapsed
                  ? "justify-center px-2 py-2.5"
                  : "gap-3 px-3 py-2"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed ? link.label : null}
            </Link>
          );
        })}
        {onToggleCollapsed ? (
          <Button
            type="button"
            variant="ghost"
            size={collapsed ? "icon-sm" : "sm"}
            className={cn(
              "text-muted-foreground hover:text-foreground mt-1 w-full",
              collapsed ? "mx-auto" : "justify-start gap-3 px-3"
            )}
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "展开侧栏" : "收起侧栏"}
            title={collapsed ? "展开侧栏" : "收起侧栏"}
          >
            {collapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <>
                <PanelLeftClose className="size-4" />
                收起侧栏
              </>
            )}
          </Button>
        ) : null}
      </div>
    </aside>
  );
}

function SidebarNavItem({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <span
        className={cn(
          "text-muted-foreground flex cursor-not-allowed items-center rounded-lg text-sm opacity-50",
          collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2"
        )}
        title={collapsed ? `${item.label}（v0.4 开放）` : "v0.4 开放"}
      >
        <Icon className="size-4 shrink-0" />
        {!collapsed ? item.label : null}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={item.active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex items-center rounded-lg text-sm font-medium transition-colors",
        collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
        item.active
          ? "bg-sidebar-accent text-primary"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
      )}
    >
      <span className="relative shrink-0">
        <Icon className="size-4" />
        {collapsed && item.badge != null ? (
          <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full text-[9px] font-bold tabular-nums">
            {item.badge > 9 ? "9+" : item.badge}
          </span>
        ) : null}
      </span>
      {!collapsed ? (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge != null ? (
            <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums">
              {item.badge}
            </span>
          ) : null}
        </>
      ) : null}
    </Link>
  );
}
