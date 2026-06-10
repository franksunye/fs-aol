"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  evaluationAgentsHref,
  evaluationMyActionsHref,
  evaluationRuleHref,
  evaluationSampleHref,
  evaluationWorkbenchActiveHref,
  QUALITY_SAMPLE_TAG_LABELS,
  type EvaluationQualitySample,
  type EvaluationQualitySampleTag,
} from "@/lib/evaluation-mock";
import { RUNS_HOME_PATH } from "@/lib/runs-nav";

const TAG_CLASSES: Record<EvaluationQualitySampleTag, string> = {
  false_positive: "border-red-200 bg-red-50 text-red-700",
  needs_edit: "border-amber-200 bg-amber-50 text-amber-800",
  rejected: "border-slate-200 bg-slate-50 text-slate-700",
  low_confidence: "border-violet-200 bg-violet-50 text-violet-800",
};

const SEVERITY_LABELS = {
  high: "高",
  medium: "中",
  low: "低",
} as const;

const SEVERITY_CLASSES = {
  high: "text-red-600",
  medium: "text-amber-700",
  low: "text-muted-foreground",
} as const;

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
          <Link href={evaluationMyActionsHref(hk)} className="hover:text-primary">
            Action 中心
          </Link>
          <span>·</span>
          <Link href={evaluationWorkbenchActiveHref(hk)} className="hover:text-primary">
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="pb-2 pr-3 font-medium">时间</th>
              <th className="pb-2 pr-3 font-medium">Agent / Action</th>
              <th className="pb-2 pr-3 font-medium">问题描述</th>
              <th className="pb-2 pr-3 font-medium">建议处理</th>
              <th className="pb-2 pr-3 font-medium">严重度</th>
              <th className="pb-2 font-medium">标签</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground py-8 text-center">
                  当前筛选下暂无样本
                </td>
              </tr>
            ) : (
              filtered.map((sample, i) => (
                <tr
                  key={`${sample.time}-${i}`}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="text-muted-foreground py-3 pr-3 whitespace-nowrap tabular-nums">
                    {sample.time}
                  </td>
                  <td className="py-3 pr-3">
                    <Link
                      href={evaluationSampleHref(sample, hk)}
                      className="hover:text-primary font-medium"
                    >
                      {sample.agentName}
                      {sample.agentVersion ? (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          {sample.agentVersion}
                        </span>
                      ) : null}
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        / {sample.actionLabel}
                      </span>
                    </Link>
                    {sample.ruleId ? (
                      <div className="mt-1">
                        <Link
                          href={evaluationRuleHref(sample.ruleId, hk)}
                          className="text-muted-foreground hover:text-primary text-[10px]"
                        >
                          规则：{sample.ruleId}
                        </Link>
                      </div>
                    ) : null}
                  </td>
                  <td className="text-muted-foreground max-w-[220px] py-3 pr-3 leading-relaxed">
                    {sample.issue}
                  </td>
                  <td className="py-3 pr-3 leading-relaxed">{sample.suggestion}</td>
                  <td
                    className={cn(
                      "py-3 pr-3 font-medium tabular-nums",
                      SEVERITY_CLASSES[sample.severity]
                    )}
                  >
                    {SEVERITY_LABELS[sample.severity]}
                  </td>
                  <td className="py-3">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-medium", TAG_CLASSES[sample.tag])}
                    >
                      {QUALITY_SAMPLE_TAG_LABELS[sample.tag]}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        共 {filtered.length} 条样本 ·{" "}
        <Link href={evaluationWorkbenchActiveHref(hk)} className="hover:text-primary">
          查看待审核队列 →
        </Link>
      </p>
    </Card>
  );
}
