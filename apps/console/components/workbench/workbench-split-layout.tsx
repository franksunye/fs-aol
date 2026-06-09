"use client";

import { useCallback, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  workbenchHref,
  workbenchListContextFromWorkbench,
} from "@/lib/workbench-nav";

export function WorkbenchSplitLayout({
  list,
  detail,
  selectedKey,
}: {
  list: ReactNode;
  detail: ReactNode | null;
  selectedKey: string | null;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const sidebarOpen = Boolean(selectedKey && detail);

  const listContext = workbenchListContextFromWorkbench({
    tab: sp.get("tab") ?? undefined,
    hk: sp.get("hk") ?? undefined,
    sort: sp.get("sort") ?? undefined,
    priority: sp.get("priority") ?? undefined,
  });
  const closeHref = workbenchHref(listContext);

  const closeSidebar = useCallback(() => {
    router.push(closeHref);
  }, [router, closeHref]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSidebar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen, closeSidebar]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const lock = () => {
      if (mq.matches) document.body.style.overflow = "hidden";
    };
    const unlock = () => {
      document.body.style.overflow = "";
    };
    lock();
    mq.addEventListener("change", lock);
    return () => {
      mq.removeEventListener("change", lock);
      unlock();
    };
  }, [sidebarOpen]);

  return (
    <div
      className="relative flex h-full min-h-0 w-full overflow-hidden"
      data-sidebar-open={sidebarOpen ? "true" : "false"}
    >
      {/* 列表：侧栏打开时固定宽度，其余空间留给详情 */}
      <section
        className={cn(
          "min-h-0 shrink-0 overflow-y-auto overscroll-contain transition-[width,max-width] duration-300 ease-out",
          sidebarOpen
            ? "w-full max-w-full basis-full lg:w-[min(38%,400px)] lg:max-w-[400px] lg:basis-[min(38%,400px)] lg:border-r lg:border-border"
            : "min-w-0 flex-1"
        )}
        aria-label="机会列表"
      >
        {list}
      </section>

      {/* 移动端遮罩 */}
      <button
        type="button"
        aria-label="关闭详情侧栏"
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          sidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={closeSidebar}
      />

      {/* 详情侧栏：占满剩余宽度，内部独立滚动 */}
      <aside
        role="complementary"
        aria-label="案件详情侧栏"
        aria-hidden={!sidebarOpen}
        className={cn(
          "bg-background flex h-full min-h-0 flex-col border-border",
          "transition-[transform,flex,opacity,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "fixed inset-y-0 right-0 z-50 w-full border-l",
          "shadow-[-16px_0_40px_-12px_rgba(15,23,42,0.2)]",
          sidebarOpen
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-full opacity-0",
          "lg:relative lg:z-auto lg:translate-x-0 lg:shadow-[-12px_0_32px_-16px_rgba(15,23,42,0.12)]",
          sidebarOpen
            ? "lg:pointer-events-auto lg:min-w-0 lg:flex-1 lg:opacity-100"
            : "lg:w-0 lg:min-w-0 lg:flex-none lg:overflow-hidden lg:border-0 lg:opacity-0 lg:shadow-none"
        )}
      >
        <header className="bg-muted/50 flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-3 lg:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              render={<Link href={closeHref} />}
              aria-label="返回列表"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              案件详情
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={closeSidebar}
            aria-label="关闭详情侧栏"
            title="关闭 (Esc)"
          >
            <PanelRightClose className="size-4" />
          </Button>
        </header>

        <div className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          {sidebarOpen ? detail : null}
        </div>
      </aside>
    </div>
  );
}
