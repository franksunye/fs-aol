"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";

const STORAGE_KEY = "aol_console_sidebar_collapsed";

export function DesktopSidebar({
  activeCount,
  closedCount,
  hk,
}: {
  activeCount: number;
  closedCount?: number;
  hk?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 overflow-hidden transition-[width] duration-200 ease-out md:block",
        !ready && "w-60",
        ready && (collapsed ? "w-[4.25rem]" : "w-60")
      )}
      data-sidebar-collapsed={collapsed ? "true" : "false"}
    >
      <SidebarNav
        activeCount={activeCount}
        closedCount={closedCount}
        hk={hk}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />
    </aside>
  );
}
