"use client";

import { useCallback, useEffect, useId, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shellScrollClass } from "@/lib/shell-preferences";
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
  const titleId = useId();
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
      if (e.key !== "Escape") return;
      if (e.defaultPrevented) return;
      closeSidebar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen, closeSidebar]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const syncBodyScroll = () => {
      document.body.style.overflow = mq.matches ? "hidden" : "";
    };
    syncBodyScroll();
    mq.addEventListener("change", syncBodyScroll);
    return () => {
      mq.removeEventListener("change", syncBodyScroll);
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div
      className="relative flex h-full min-h-0 w-full overflow-hidden"
      data-sidebar-open={sidebarOpen ? "true" : "false"}
    >
      <section
        className={cn(
          shellScrollClass,
          "shrink-0 transition-[width,max-width] duration-300 ease-out motion-reduce:transition-none",
          sidebarOpen
            ? "w-full max-w-full basis-full lg:w-[min(38%,400px)] lg:max-w-[400px] lg:basis-[min(38%,400px)] lg:border-r lg:border-border"
            : "min-w-0 flex-1"
        )}
        aria-label="机会列表"
      >
        {list}
      </section>

      <button
        type="button"
        aria-label="关闭详情侧栏"
        aria-hidden={!sidebarOpen}
        tabIndex={sidebarOpen ? 0 : -1}
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none lg:hidden",
          sidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={closeSidebar}
      />

      <aside
        role="complementary"
        aria-label="案件详情"
        aria-labelledby={sidebarOpen ? titleId : undefined}
        aria-hidden={!sidebarOpen}
        {...(!sidebarOpen ? { inert: true } : {})}
        className={cn(
          "bg-background flex h-full min-h-0 flex-col border-border",
          "transition-[transform,flex,opacity,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
          "fixed inset-y-0 right-0 z-50 w-full border-l",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
          "shadow-[-16px_0_40px_-12px_rgba(15,23,42,0.2)]",
          sidebarOpen
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-full opacity-0",
          "lg:relative lg:z-auto lg:translate-x-0 lg:pt-0 lg:pb-0 lg:shadow-[-12px_0_32px_-16px_rgba(15,23,42,0.12)]",
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
              render={<Link href={closeHref} scroll={false} />}
              aria-label="返回列表"
            >
              <ArrowLeft className="size-4" aria-hidden />
            </Button>
            <span
              id={titleId}
              className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase"
            >
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
            <PanelRightClose className="size-4" aria-hidden />
          </Button>
        </header>

        <div className={cn(shellScrollClass, "w-full flex-1")}>
          {sidebarOpen ? detail : null}
        </div>
      </aside>
    </div>
  );
}
