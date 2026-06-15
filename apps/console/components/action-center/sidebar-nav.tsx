"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  CalendarDays,
  CircleHelp,
  LayoutDashboard,
  Link2,
  ListTodo,
  Play,
  PanelLeft,
  PanelLeftClose,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { SidebarBrand } from "./sidebar-brand";
import { cn } from "@/lib/utils";
import { INTEGRATIONS_HOME_PATH } from "@/lib/integrations-nav";
import { RUNS_HOME_PATH } from "@/lib/runs-nav";
import { GOVERNANCE_HOME_PATH } from "@/lib/governance-nav";
import { calendarHref } from "@/lib/calendar-nav";
import { actionCenterHref } from "@/lib/action-center-nav";
import { OVERVIEW_HOME_PATH } from "@/lib/overview-nav";
import { AI_INFRASTRUCTURE_PATH } from "@/lib/settings-nav";
import { stripPaneSelectionParams } from "@/lib/action-center-nav";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const navItemClass = (opts: {
  collapsed: boolean;
  active?: boolean;
  disabled?: boolean;
}) =>
  cn(
    "relative flex items-center rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
    opts.collapsed ? "min-h-11 justify-center px-2 py-2" : "gap-3 px-3 py-2",
    opts.disabled
      ? "text-muted-foreground cursor-not-allowed opacity-50"
      : opts.active
        ? "bg-sidebar-accent text-primary"
        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
  );

export function SidebarNav({
  activeCount,
  closedCount,
  hk,
  collapsed = false,
  onToggleCollapsed,
  collapseShortcutLabel,
  onNavigate,
}: {
  activeCount: number;
  closedCount?: number;
  hk?: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  collapseShortcutLabel?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const onOverview = pathname === "/overview";
  const onActionCenter = pathname === "/";
  const onCalendar = pathname.startsWith("/calendar");
  const onAnalytics = pathname === "/analytics";
  const onAgents = pathname === "/agents";
  const onRuns = pathname.startsWith("/runs");
  const onIntegrations = pathname.startsWith("/integrations");
  const onGovernance = pathname.startsWith("/governance");
  const onSettings = pathname.startsWith("/settings");

  const overviewNavHref = hk
    ? `${OVERVIEW_HOME_PATH}?hk=${encodeURIComponent(hk)}`
    : OVERVIEW_HOME_PATH;

  const items: NavItem[] = [
    {
      label: "总览",
      icon: LayoutDashboard,
      href: overviewNavHref,
      active: onOverview,
    },
    {
      label: "Actions",
      icon: ListTodo,
      href: actionCenterHref(hk),
      active: onActionCenter,
      badge: activeCount > 0 ? activeCount : undefined,
    },
    {
      label: "日历",
      icon: CalendarDays,
      href: calendarHref(hk),
      active: onCalendar,
    },
    {
      label: "Runs",
      icon: Play,
      href: RUNS_HOME_PATH,
      active: onRuns,
    },
    {
      label: "评估",
      icon: BarChart3,
      href: analyticsHref(sp, hk),
      active: onAnalytics,
    },
    {
      label: "Agents",
      icon: Bot,
      href: "/agents",
      active: onAgents,
    },
    {
      label: "集成",
      icon: Link2,
      href: INTEGRATIONS_HOME_PATH,
      active: onIntegrations,
    },
    {
      label: "治理",
      icon: ShieldCheck,
      href: GOVERNANCE_HOME_PATH,
      active: onGovernance,
    },
  ];

  const footerLinks = [
    {
      label: "设置",
      icon: Settings,
      href: AI_INFRASTRUCTURE_PATH,
      active: onSettings,
    },
    {
      label: "帮助与反馈",
      icon: CircleHelp,
      href: "https://github.com/franksunye/fs-aol/blob/main/docs/README.md",
      external: true,
    },
  ];

  return (
    <div className="text-sidebar-foreground flex h-full w-full flex-col">
      <div
        className={cn(
          "flex shrink-0 border-b border-sidebar-border transition-[padding] duration-200 motion-reduce:transition-none",
          collapsed ? "justify-center px-2 py-4" : "px-4 py-4"
        )}
      >
        <SidebarBrand collapsed={collapsed} />
      </div>

      <nav
        className={cn("min-h-0 flex-1 space-y-0.5 overflow-y-auto", collapsed ? "p-2" : "p-3")}
        aria-label="主导航"
      >
        {items.map((item) => (
          <SidebarNavItem
            key={item.label}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div
        className={cn(
          "shrink-0 space-y-0.5 border-t border-sidebar-border",
          collapsed ? "p-2" : "p-3"
        )}
      >
        {footerLinks.map((link) => (
          <SidebarFooterLink
            key={link.label}
            link={link}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
        {onToggleCollapsed ? (
          <Button
            type="button"
            variant="ghost"
            size={collapsed ? "icon-sm" : "sm"}
            className={cn(
              "text-muted-foreground hover:text-foreground mt-1 w-full focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              collapsed ? "mx-auto min-h-11" : "justify-start gap-3 px-3"
            )}
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "展开侧栏" : "收起侧栏"}
            title={
              collapseShortcutLabel
                ? `${collapsed ? "展开" : "收起"}侧栏 (${collapseShortcutLabel})`
                : collapsed
                  ? "展开侧栏"
                  : "收起侧栏"
            }
          >
            {collapsed ? (
              <PanelLeft className="size-4" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="size-4" aria-hidden />
                <span>收起侧栏</span>
                {collapseShortcutLabel ? (
                  <kbd className="text-muted-foreground bg-muted/80 ml-auto hidden rounded px-1.5 py-0.5 font-mono text-[10px] lg:inline">
                    {collapseShortcutLabel}
                  </kbd>
                ) : null}
              </>
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function SidebarNavItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const tooltip = item.disabled
    ? `${item.label}（即将开放）`
    : item.badge != null && collapsed
      ? `${item.label} · ${item.badge}`
      : item.label;

  const content = (
    <>
      <span className="relative shrink-0">
        <Icon className="size-4" aria-hidden />
        {collapsed && item.badge != null ? (
          <span
            className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full text-[9px] font-bold tabular-nums"
            aria-hidden
          >
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
    </>
  );

  if (item.disabled) {
    const node = (
      <span
        className={navItemClass({ collapsed, disabled: true })}
        aria-disabled="true"
      >
        {content}
      </span>
    );
    if (!collapsed) return node;
    return (
      <Tooltip>
        <TooltipTrigger render={node} />
        <TooltipContent side="right" sideOffset={8}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  const link = (
    <Link
      href={item.href}
      scroll={false}
      onClick={onNavigate}
      aria-current={item.active ? "page" : undefined}
      className={navItemClass({ collapsed, active: item.active })}
    >
      {content}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right" sideOffset={8}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarFooterLink({
  link,
  collapsed,
  onNavigate,
}: {
  link: {
    label: string;
    icon: LucideIcon;
    href: string;
    external?: boolean;
    active?: boolean;
  };
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = link.icon;
  const anchor = (
    <Link
      href={link.href}
      scroll={link.external ? undefined : false}
      target={link.external ? "_blank" : undefined}
      rel={link.external ? "noopener noreferrer" : undefined}
      onClick={onNavigate}
      aria-current={link.active ? "page" : undefined}
      className={cn(
        "flex items-center rounded-lg text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        collapsed ? "min-h-11 justify-center px-2 py-2" : "gap-3 px-3 py-2",
        link.active
          ? "bg-sidebar-accent text-primary"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {!collapsed ? link.label : null}
    </Link>
  );

  if (!collapsed) return anchor;

  return (
    <Tooltip>
      <TooltipTrigger render={anchor} />
      <TooltipContent side="right" sideOffset={8}>
        {link.label}
      </TooltipContent>
    </Tooltip>
  );
}
