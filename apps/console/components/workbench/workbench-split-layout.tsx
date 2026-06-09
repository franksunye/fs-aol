"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Inbox } from "lucide-react";
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
  showPlaceholder = true,
}: {
  list: ReactNode;
  detail: ReactNode | null;
  selectedKey: string | null;
  /** 宽屏无选中时是否展示右侧空态（邮件客户端式） */
  showPlaceholder?: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const paneOpen = Boolean(selectedKey && detail);

  const listContext = workbenchListContextFromWorkbench({
    tab: sp.get("tab") ?? undefined,
    hk: sp.get("hk") ?? undefined,
    sort: sp.get("sort") ?? undefined,
    priority: sp.get("priority") ?? undefined,
  });
  const closeHref = workbenchHref(listContext);

  useEffect(() => {
    if (!paneOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(closeHref);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [paneOpen, router, closeHref]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col lg:min-h-[calc(100dvh-0px)] lg:flex-row">
      {/* 列表区 */}
      <section
        className={cn(
          "min-h-0 shrink-0 overflow-y-auto",
          paneOpen
            ? "hidden w-full lg:block lg:w-[min(42%,520px)] lg:max-w-[520px] lg:border-r lg:border-border"
            : "w-full flex-1",
          showPlaceholder && !paneOpen && "lg:w-[min(42%,520px)] lg:max-w-[520px] lg:border-r lg:border-border"
        )}
        aria-label="机会列表"
      >
        {list}
      </section>

      {/* 详情区：移动端全屏覆盖；桌面常驻右栏 */}
      <section
        className={cn(
          "bg-background min-h-0 flex-col",
          paneOpen
            ? "fixed inset-0 z-40 flex lg:static lg:z-auto lg:flex-1"
            : showPlaceholder
              ? "hidden lg:flex lg:flex-1"
              : "hidden"
        )}
        aria-label="案件详情"
      >
        {paneOpen ? (
          <>
            <div className="flex items-center gap-2 border-b border-border px-3 py-2 lg:hidden">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1"
                render={<Link href={closeHref} />}
              >
                <ArrowLeft className="size-4" />
                列表
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {detail}
            </div>
          </>
        ) : showPlaceholder ? (
          <WorkbenchDetailPlaceholder />
        ) : null}
      </section>
    </div>
  );
}

function WorkbenchDetailPlaceholder() {
  return (
    <div className="text-muted-foreground flex h-full min-h-[320px] flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="bg-muted flex size-14 items-center justify-center rounded-2xl">
        <Inbox className="size-7 opacity-60" aria-hidden />
      </div>
      <div>
        <p className="text-foreground text-sm font-medium">选择一条机会</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed">
          点击左侧列表即可在本页右侧查看详情；切换条目时详情同步更新，无需返回导航。
        </p>
      </div>
      <p className="text-[11px] opacity-70">Esc 关闭详情 · 宽屏始终分栏浏览</p>
    </div>
  );
}
