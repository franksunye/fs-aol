"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkbenchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <AlertTriangle className="text-destructive mb-4 size-10" aria-hidden />
      <h1 className="text-lg font-semibold">Action中心暂时不可用</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        数据加载失败，常见于 Turso 超时。点击重试或返回 Action中心。
      </p>
      <div className="mt-6 flex gap-2">
        <Button type="button" onClick={() => reset()}>
          重试
        </Button>
        <Button type="button" variant="outline" onClick={() => window.location.assign("/")}>
          返回 Action中心
        </Button>
      </div>
    </main>
  );
}
