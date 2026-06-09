"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function MobileHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 flex items-center border-b border-border bg-card px-2 py-3 shadow-sm">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full active:bg-muted"
        aria-label="返回"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <h1 className="text-foreground flex-1 pr-10 text-center text-base font-semibold tracking-tight">
        跟进行动 · 反馈
      </h1>
    </header>
  );
}
