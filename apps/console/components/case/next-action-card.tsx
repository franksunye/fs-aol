"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { SuggestionDoc } from "@/lib/suggestions";

export function NextActionCard({ suggestion }: { suggestion: SuggestionDoc }) {
  const plan = suggestion.跟进方案;
  const action = plan?.主行动?.trim();
  const points = plan?.沟通要点 ?? [];
  if (!action && points.length === 0) return null;

  const script = [action, ...points.map((p) => `· ${p}`)]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm">
      <p className="mb-1 text-xs font-semibold tracking-wide text-emerald-800 uppercase">
        Next Best Action
      </p>
      {action ? (
        <p className="text-sm font-medium text-emerald-950">{action}</p>
      ) : null}
      {points.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-emerald-900">
          {points.map((p) => (
            <li key={p}>· {p}</li>
          ))}
        </ul>
      ) : null}
      {script ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
          onClick={async () => {
            await navigator.clipboard.writeText(script);
            toast.success("已复制沟通要点");
          }}
        >
          <Copy className="mr-1.5 size-3.5" />
          复制脚本
        </Button>
      ) : null}
    </div>
  );
}
