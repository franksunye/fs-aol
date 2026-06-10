"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { OVERVIEW_SITE_OPTIONS } from "@/lib/overview-mock";

export function ExecutionSiteSelect({ hk }: { hk?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const current = sp.get("site") ?? "all";

  return (
    <select
      className="border-input bg-background h-9 min-w-[8.5rem] rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      value={current}
      aria-label="选择站点范围"
      onChange={(e) => {
        const q = new URLSearchParams(sp.toString());
        q.set("tab", "execution");
        if (e.target.value === "all") q.delete("site");
        else q.set("site", e.target.value);
        if (hk) q.set("hk", hk);
        else q.delete("hk");
        router.push(`/?${q.toString()}`);
      }}
    >
      {OVERVIEW_SITE_OPTIONS.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
