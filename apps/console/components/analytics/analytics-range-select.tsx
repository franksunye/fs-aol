"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { AnalyticsRangeKey } from "@/lib/analytics";

const OPTIONS: { key: AnalyticsRangeKey; label: string }[] = [
  { key: "week", label: "本周" },
  { key: "last_week", label: "上周" },
  { key: "month", label: "本月" },
  { key: "last_7", label: "近 7 天" },
  { key: "last_30", label: "近 30 天" },
];

export function AnalyticsRangeSelect({
  currentKey,
  rangeLabel,
  hk,
}: {
  currentKey: AnalyticsRangeKey;
  rangeLabel: string;
  hk?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">时间范围：</span>
      <select
        className="border-input bg-background h-9 min-w-[12rem] rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={currentKey}
        aria-label="选择分析时间范围"
        onChange={(e) => {
          const q = new URLSearchParams(sp.toString());
          q.set("range", e.target.value);
          if (hk) q.set("hk", hk);
          else q.delete("hk");
          router.push(`/analytics?${q.toString()}`);
        }}
      >
        {OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.key === currentKey ? rangeLabel : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
