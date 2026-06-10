"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveWorkbenchBack } from "@/lib/workbench-nav";

export default function SuggestionDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const sp = useSearchParams();
  const back = resolveWorkbenchBack(
    {
      from: sp.get("from") ?? undefined,
      hk: sp.get("hk") ?? undefined,
      sort: sp.get("sort") ?? undefined,
      priority: sp.get("priority") ?? undefined,
    },
    "active"
  );

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-12 text-center">
      <AlertTriangle className="text-destructive mb-4 size-10" aria-hidden />
      <h1 className="text-lg font-semibold">案件详情加载失败</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        无法读取工单、trace 或时间轴。请重试或返回 Action中心。
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => reset()}>
          重试
        </Button>
        <Button
          type="button"
          variant="outline"
          render={<Link href={back.href} />}
        >
          {back.label}
        </Button>
      </div>
    </main>
  );
}
