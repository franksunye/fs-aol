"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  evaluationAgentsHref,
  evaluationExecutionActionsHref,
  evaluationActionReviewHref,
  type EvaluationQualitySample,
  type EvaluationQualitySampleTag,
} from "@/lib/evaluation-mock";
import { RUNS_HOME_PATH } from "@/lib/runs-nav";
import { EvaluationQualitySamplesTable } from "./evaluation-quality-samples-table";

const FILTER_OPTIONS: { id: "all" | EvaluationQualitySampleTag; label: string }[] =
  [
    { id: "all", label: "全部" },
    { id: "false_positive", label: "误报" },
    { id: "needs_edit", label: "需修改" },
    { id: "rejected", label: "已拒绝" },
    { id: "low_confidence", label: "低置信" },
  ];

export function EvaluationQualitySamples({
  samples,
  hk,
}: {
  samples: EvaluationQualitySample[];
  hk?: string;
}) {
  const [tagFilter, setTagFilter] = useState<"all" | EvaluationQualitySampleTag>(
    "all"
  );

  const filtered = useMemo(
    () =>
      tagFilter === "all"
        ? samples
        : samples.filter((sample) => sample.tag === tagFilter),
    [samples, tagFilter]
  );

  return (
    <Card className="rounded-xl border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">失败与低质量样本抽检</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            抽样查看误报、需修改与低置信输出，跳转 Action / Run / 工单
          </p>
        </div>
        <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
          <Link href={evaluationExecutionActionsHref(hk)} className="hover:text-primary">
            Action 中心
          </Link>
          <span>·</span>
          <Link href={evaluationActionReviewHref(hk)} className="hover:text-primary">
            待审核
          </Link>
          <span>·</span>
          <Link
            href={hk ? `${RUNS_HOME_PATH}?hk=${encodeURIComponent(hk)}` : RUNS_HOME_PATH}
            className="hover:text-primary"
          >
            Runs
          </Link>
          <span>·</span>
          <Link href={evaluationAgentsHref(undefined, hk)} className="hover:text-primary">
            Agents
          </Link>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTagFilter(opt.id)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
              tagFilter === opt.id
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/20"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <EvaluationQualitySamplesTable
        samples={filtered}
        hk={hk}
        resetDeps={[tagFilter]}
      />

      <p className="text-muted-foreground mt-3 text-xs">
        <Link href={evaluationActionReviewHref(hk)} className="hover:text-primary">
          查看待审核队列 →
        </Link>
      </p>
    </Card>
  );
}
