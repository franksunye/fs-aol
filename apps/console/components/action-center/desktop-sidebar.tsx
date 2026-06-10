"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { sidebarToggleShortcutLabel } from "@/lib/shell-keyboard";
import {
  migrateSidebarCollapsedFromStorage,
  persistSidebarCollapsed,
} from "@/lib/shell-preferences";
import { SidebarNav } from "./sidebar-nav";

export function DesktopSidebar({
  activeCount,
  closedCount,
  hk,
  initialCollapsed = false,
}: {
  activeCount: number;
  closedCount?: number;
  hk?: string;
  initialCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  useEffect(() => {
    const migrated = migrateSidebarCollapsedFromStorage();
    if (migrated != null && migrated !== initialCollapsed) {
      setCollapsed(migrated);
    }
  }, [initialCollapsed]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      persistSidebarCollapsed(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "b" && e.key !== "B") return;
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.altKey || e.shiftKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement | null)?.isContentEditable) return;
      e.preventDefault();
      toggleCollapsed();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleCollapsed]);

  const shortcut = sidebarToggleShortcutLabel();

  return (
    <aside
      aria-label="应用导航"
      className={cn(
        "bg-sidebar hidden h-full shrink-0 overflow-hidden border-r border-sidebar-border transition-[width] duration-200 ease-out motion-reduce:transition-none md:block",
        collapsed ? "w-[4.25rem]" : "w-60"
      )}
      data-sidebar-collapsed={collapsed ? "true" : "false"}
    >
      <SidebarNav
        activeCount={activeCount}
        closedCount={closedCount}
        hk={hk}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        collapseShortcutLabel={shortcut}
      />
    </aside>
  );
}
