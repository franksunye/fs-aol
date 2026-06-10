"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

function errorContext(pathname: string): {
  title: string;
  backHref: string;
  backLabel: string;
} {
  if (pathname.startsWith("/analytics")) {
    return {
      title: "评估分析暂时不可用",
      backHref: "/analytics",
      backLabel: "返回评估分析",
    };
  }
  if (pathname.startsWith("/overview")) {
    return {
      title: "运营总览暂时不可用",
      backHref: "/overview",
      backLabel: "返回运营总览",
    };
  }
  if (pathname.startsWith("/governance")) {
    return {
      title: "治理中心暂时不可用",
      backHref: "/governance",
      backLabel: "返回治理",
    };
  }
  if (pathname.startsWith("/runs")) {
    return {
      title: "Runs 运行中心暂时不可用",
      backHref: "/runs",
      backLabel: "返回 Runs",
    };
  }
  return {
    title: "Action中心暂时不可用",
    backHref: "/",
    backLabel: "返回 Action中心",
  };
}

export default function WorkbenchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const ctx = errorContext(pathname);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <AlertTriangle className="text-destructive mb-4 size-10" aria-hidden />
      <h1 className="text-lg font-semibold">{ctx.title}</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        数据加载失败，常见于 Turso 超时。点击重试或返回上一页。
      </p>
      <div className="mt-6 flex gap-2">
        <Button type="button" onClick={() => reset()}>
          重试
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.assign(ctx.backHref)}
        >
          {ctx.backLabel}
        </Button>
      </div>
    </main>
  );
}
