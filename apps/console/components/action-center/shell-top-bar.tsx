"use client";

import { Suspense } from "react";
import { ActionReviewSearchBar } from "./action-review-search-bar";

export function ShellTopBar() {
  return (
    <div className="bg-background hidden shrink-0 items-center gap-3 border-b border-border px-4 py-2 md:flex">
      <Suspense fallback={<div className="bg-muted h-9 max-w-md flex-1 animate-pulse rounded-md" />}>
        <ActionReviewSearchBar />
      </Suspense>
      <p className="text-muted-foreground hidden shrink-0 text-[11px] lg:block">
        <kbd className="bg-muted rounded px-1 font-mono">j</kbd>
        <kbd className="bg-muted mx-0.5 rounded px-1 font-mono">k</kbd>
        切换 ·
        <kbd className="bg-muted mx-1 rounded px-1 font-mono">Enter</kbd>
        打开
      </p>
    </div>
  );
}
