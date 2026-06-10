"use client";

import { useRouter } from "next/navigation";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ExecutionSiteSelect } from "./execution/execution-site-select";

export function ExecutionToolbar({ hk }: { hk?: string }) {
  const router = useRouter();

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="刷新待执行列表"
        onClick={() => router.refresh()}
      >
        <RefreshCw className="size-3.5" aria-hidden />
      </Button>
      <ExecutionSiteSelect hk={hk} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1 px-2.5 text-xs"
        onClick={() =>
          toast.message("演示数据，暂未接入", {
            description: "导出将在后续版本开放。",
          })
        }
      >
        <Download className="size-3.5" aria-hidden />
        导出
      </Button>
    </>
  );
}
