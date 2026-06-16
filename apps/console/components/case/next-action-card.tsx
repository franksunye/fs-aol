"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { SuggestionDoc } from "@/lib/suggestions";
import { CaseSourceBadge } from "@/components/case/case-source-badge";
import { CaseSection } from "./case-section";

export function NextActionCard({ suggestion }: { suggestion: SuggestionDoc }) {
  const plan = suggestion.跟进方案;
  const action = plan?.主行动?.trim();
  const points = plan?.沟通要点 ?? [];

  const script = [action, ...points.map((p) => `· ${p}`)]
    .filter(Boolean)
    .join("\n");

  return (
    <CaseSection
      title="建议行动"
      action={<CaseSourceBadge kind="agent" />}
      className="border-l-4 border-l-violet-300 border-emerald-200"
      bodyClassName="bg-emerald-50/50"
    >
      {action ? (
        <p className="text-sm font-medium text-emerald-950">{action}</p>
      ) : (
        <p className="text-muted-foreground text-sm">暂无主行动建议</p>
      )}
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
            toast.success("已复制话术");
          }}
        >
          <Copy className="mr-1.5 size-3.5" />
          复制话术
        </Button>
      ) : null}
    </CaseSection>
  );
}
