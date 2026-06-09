"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { SuggestionSortKey } from "@/lib/suggestion-sorting";
import { stripPaneSelectionParams } from "@/lib/workbench-nav";

const OPTIONS: Array<{ value: SuggestionSortKey; label: string }> = [
  { value: "latest", label: "最新建议" },
  { value: "housekeeper", label: "管家" },
  { value: "stale", label: "滞留时间" },
  { value: "priority", label: "优先级" },
  { value: "disposition", label: "反馈情况" },
];

export function SuggestionSort({
  current,
  compact = false,
}: {
  current: SuggestionSortKey;
  compact?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function onChange(value: SuggestionSortKey) {
    const params = new URLSearchParams(searchParams.toString());
    stripPaneSelectionParams(params);
    if (value === "latest") params.delete("sort");
    else params.set("sort", value);
    const qs = params.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;
    startTransition(() => {
      router.replace(href);
    });
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Label className="text-muted-foreground shrink-0 text-[11px]">排序</Label>
        <select
          className="border-input bg-background h-7 min-w-[6.5rem] rounded-md border px-1.5 text-xs outline-none focus-visible:border-ring"
          value={current}
          disabled={pending}
          aria-label="排序方式"
          onChange={(e) => onChange(e.target.value as SuggestionSortKey)}
        >
          {OPTIONS.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Label className="text-muted-foreground shrink-0 text-xs">排序</Label>
      <div className="flex flex-wrap items-center gap-1">
        {OPTIONS.map((op) => {
          const active = current === op.value;
          return (
            <Button
              key={op.value}
              type="button"
              size="xs"
              variant={active ? "secondary" : "outline"}
              disabled={pending}
              onClick={() => onChange(op.value)}
              aria-pressed={active}
            >
              {op.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
