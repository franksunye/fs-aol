"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
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
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <AlertTriangle className="text-destructive mb-4 size-12" aria-hidden />
      <h1 className="text-xl font-semibold">页面加载失败</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
        可能是 Turso 连接暂时不可用。请稍后重试；若持续失败，请检查环境变量与网络。
      </p>
      {error.digest ? (
        <p className="text-muted-foreground mt-2 font-mono text-xs">
          {error.digest}
        </p>
      ) : null}
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
