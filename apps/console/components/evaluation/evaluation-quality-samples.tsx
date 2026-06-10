"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  evaluationActionsHref,
  evaluationAgentsHref,
  evaluationSampleHref,
  evaluationWorkbenchActiveHref,
  QUALITY_SAMPLE_TAG_LABELS,
  type EvaluationQualitySample,
} from "@/lib/evaluation-mock";
import { RUNS_HOME_PATH } from "@/lib/runs-nav";

const TAG_CLASSES = {
  false_positive: "border-red-200 bg-red-50 text-red-700",
  needs_edit: "border-amber-200 bg-amber-50 text-amber-800",
} as const;

export function EvaluationQualitySamples({
  samples,
  hk,
}: {
  samples: EvaluationQualitySample[];
  hk?: string;
}) {
  return (
    <Card className="rounded-xl border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">低质量样本抽检</h2>
          <p className="text-muted-foreground mt-1 text-xs">近 7 天需人工复核的典型案例</p>
        </div>
        <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
          <Link href={evaluationWorkbenchActiveHref(hk)} className="hover:text-primary">
            待审核
          </Link>
          <span>·</span>
          <Link href={evaluationActionsHref(hk)} className="hover:text-primary">
            Action 流转
          </Link>
          <span>·</span>
          <Link href={hk ? `${RUNS_HOME_PATH}?hk=${encodeURIComponent(hk)}` : RUNS_HOME_PATH} className="hover:text-primary">
            Runs
          </Link>
          <span>·</span>
          <Link href={evaluationAgentsHref(undefined, hk)} className="hover:text-primary">
            Agents
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="pb-2 pr-3 font-medium">时间</th>
              <th className="pb-2 pr-3 font-medium">Agent / Action</th>
              <th className="pb-2 pr-3 font-medium">问题描述</th>
              <th className="pb-2 pr-3 font-medium">建议处理</th>
              <th className="pb-2 font-medium">标签</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((sample, i) => (
              <tr key={`${sample.time}-${i}`} className="border-b border-border/60 last:border-0">
                <td className="text-muted-foreground py-3 pr-3 whitespace-nowrap tabular-nums">
                  {sample.time}
                </td>
                <td className="py-3 pr-3">
                  <Link
                    href={evaluationSampleHref(sample, hk)}
                    className="hover:text-primary font-medium"
                  >
                    {sample.agentName}
                    <span className="text-muted-foreground font-normal"> / {sample.actionLabel}</span>
                  </Link>
                </td>
                <td className="text-muted-foreground max-w-[220px] py-3 pr-3 leading-relaxed">
                  {sample.issue}
                </td>
                <td className="py-3 pr-3 leading-relaxed">{sample.suggestion}</td>
                <td className="py-3">
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] font-medium", TAG_CLASSES[sample.tag])}
                  >
                    {QUALITY_SAMPLE_TAG_LABELS[sample.tag]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        <Link href={evaluationWorkbenchActiveHref(hk)} className="hover:text-primary">
          查看全部样本 →
        </Link>
      </p>
    </Card>
  );
}
