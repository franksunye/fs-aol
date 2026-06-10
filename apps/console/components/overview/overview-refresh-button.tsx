"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OverviewRefreshButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label="刷新运营总览"
      onClick={() => router.refresh()}
    >
      <RefreshCw className="size-4" aria-hidden />
    </Button>
  );
}
