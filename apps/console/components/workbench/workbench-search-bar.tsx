"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { stripPaneSelectionParams } from "@/lib/workbench-nav";
import { cn } from "@/lib/utils";

export function WorkbenchSearchBar({
  className,
  placeholder = "搜索工单号、摘要…",
}: {
  className?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const q = sp.get("q") ?? "";

  const applyQuery = useCallback(
    (value: string) => {
      const next = new URLSearchParams(sp.toString());
      const trimmed = value.trim();
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      stripPaneSelectionParams(next);
      const s = next.toString();
      router.push(s ? `${pathname}?${s}` : pathname);
    },
    [pathname, router, sp]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "k" && e.key !== "K") return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement | null)?.isContentEditable) return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (pathname !== "/") return null;

  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        defaultValue={q}
        placeholder={placeholder}
        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full max-w-md rounded-md border pr-16 pl-9 text-sm outline-none focus-visible:ring-2"
        aria-label="搜索工单"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            applyQuery(e.currentTarget.value);
          }
          if (e.key === "Escape") {
            e.currentTarget.blur();
            if (q) applyQuery("");
          }
        }}
        onBlur={(e) => {
          if (e.currentTarget.value.trim() !== q.trim()) {
            applyQuery(e.currentTarget.value);
          }
        }}
      />
      <kbd className="text-muted-foreground bg-muted/80 pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded px-1.5 py-0.5 font-mono text-[10px] sm:inline">
        ⌘K
      </kbd>
    </div>
  );
}
