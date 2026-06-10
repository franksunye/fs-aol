"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ExternalLink,
  MinusCircle,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CaseSection } from "@/components/case/case-section";
import { cn } from "@/lib/utils";
import { agentDetailHref } from "@/lib/agents-nav";
import {
  formatCost,
  formatDuration,
  modelLabel,
  PIPELINE_STAGE_LABELS,
  type MockRun,
  type PipelineStage,
  type PipelineStageStatus,
} from "@/lib/runs-mock";
import { executionActionHref } from "@/lib/action-execution-mock";
import { actionReviewPaneHref } from "@/lib/action-center-nav";
import {
  runDetailHref,
  runsAgentFilterHref,
  runsEvaluationHref,
} from "@/lib/runs-nav";
import { RunStatusBadge } from "./run-status-badge";
import { DataStateBadge, DataStateNote } from "@/components/data-state-badge";

const STAGE_STATUS_META: Record<
  PipelineStageStatus,
  { icon: typeof CheckCircle2; className: string; dotClass: string }
> = {
  ok: {
    icon: CheckCircle2,
    className: "text-emerald-600",
    dotClass: "bg-emerald-500 ring-emerald-100",
  },
  warn: {
    icon: RotateCcw,
    className: "text-amber-700",
    dotClass: "bg-amber-500 ring-amber-100",
  },
  fail: {
    icon: AlertTriangle,
    className: "text-red-600",
    dotClass: "bg-red-500 ring-red-100",
  },
  skip: {
    icon: MinusCircle,
    className: "text-muted-foreground",
    dotClass: "bg-muted-foreground/40 ring-muted/50",
  },
};

function PipelineStageRow({
  stage,
  isLast,
  defaultOpen,
}: {
  stage: PipelineStage;
  isLast: boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = STAGE_STATUS_META[stage.status];
  const Icon = meta.icon;
  const hasBody =
    Boolean(stage.kv?.length) ||
    Boolean(stage.bullets?.length) ||
    Boolean(stage.code);

  return (
    <li className="relative pl-8">
      {!isLast ? (
        <span
          className="bg-border absolute top-5 left-[0.6875rem] h-[calc(100%+0.25rem)] w-px"
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "absolute top-1 left-0 flex size-[1.375rem] items-center justify-center rounded-full ring-4",
          meta.dotClass
        )}
        aria-hidden
      >
        <Circle className="size-1.5 fill-white text-white" />
      </span>

      <div className="rounded-lg border border-border bg-card/60">
        <button
          type="button"
          onClick={() => hasBody && setOpen((v) => !v)}
          disabled={!hasBody}
          className={cn(
            "flex w-full items-start gap-2 px-3 py-2.5 text-left",
            hasBody && "hover:bg-muted/30"
          )}
        >
          <Icon className={cn("mt-0.5 size-3.5 shrink-0", meta.className)} aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wide uppercase">
                {PIPELINE_STAGE_LABELS[stage.id]}
              </span>
              <span className="text-muted-foreground font-mono text-[10px] tabular-nums">
                {stage.at}
              </span>
            </div>
            <p className="mt-0.5 text-sm font-medium leading-snug">{stage.headline}</p>
          </div>
          {hasBody ? (
            <ChevronDown
              className={cn(
                "text-muted-foreground mt-0.5 size-3.5 shrink-0 transition-transform",
                open && "rotate-180"
              )}
              aria-hidden
            />
          ) : null}
        </button>

        {open && hasBody ? (
          <div className="space-y-2 border-t border-border px-3 py-2.5">
            {stage.kv?.length ? (
              <dl className="grid gap-1.5 sm:grid-cols-2">
                {stage.kv.map((item) => (
                  <div key={item.label} className="min-w-0">
                    <dt className="text-muted-foreground text-[10px]">{item.label}</dt>
                    <dd className="text-xs font-medium leading-snug">{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {stage.bullets?.length ? (
              <ul className="text-muted-foreground list-inside list-disc space-y-0.5 text-xs leading-relaxed">
                {stage.bullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
            {stage.code ? (
              <pre className="bg-muted/50 overflow-x-auto rounded-md border border-border p-2.5 font-mono text-[10px] leading-relaxed">
                {stage.code}
              </pre>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function RunsDetailPanel({
  run,
  hk,
}: {
  run: MockRun;
  hk?: string;
}) {
  const listContext = { hk, from: "active" as const };
  const failedStageIndex = run.pipeline.findIndex((s) => s.status === "fail");

  return (
    <div className="space-y-4 p-4 lg:p-5">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-base font-semibold">{run.id}</h1>
          <RunStatusBadge status={run.status} />
          <DataStateBadge
            state={run.agentId === "follow-up" ? "live" : "scenario"}
            label={run.agentId === "follow-up" ? "真实 trace" : "Run 样例"}
          />
          {run.analysisRound ? (
            <Badge variant="secondary">{run.analysisRound} 次分析</Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          <Link
            href={agentDetailHref(run.agentId)}
            className="text-foreground hover:text-primary font-medium hover:underline"
          >
            {run.agentName}
          </Link>
          {" · "}
          {run.triggerSource}
          {" · "}
          {modelLabel(run.model)}
          {" · "}
          <span className="font-mono text-xs">{run.relatedObjectId}</span>
        </p>
        <DataStateNote>
          {run.agentId === "follow-up"
            ? "该 Run 展示真实楔子的信任轨：从触发、上下文、规则/模型判断到 Action 产出。"
            : "该 Run 用于展示多 Agent 可观测形态；上线前需接入真实触发源、上下文和执行结果。"}
        </DataStateNote>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            render={
              <Link href={agentDetailHref(run.agentId)} scroll={false} />
            }
          >
            Agent 配置
            <ExternalLink className="size-3" aria-hidden />
          </Button>
          {run.actionId ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs"
              render={
                <Link href={executionActionHref(run.actionId, hk)} scroll={false} />
              }
            >
              Action 流转
              <ChevronRight className="size-3" aria-hidden />
            </Button>
          ) : null}
          {run.workOrderKey ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs"
              render={
                <Link
                  href={actionReviewPaneHref(run.workOrderKey, listContext)}
                  scroll={false}
                />
              }
            >
              工作台
              <ChevronRight className="size-3" aria-hidden />
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            render={
              <Link href={runsEvaluationHref(run.agentId, hk)} scroll={false} />
            }
          >
            效果评估
            <ExternalLink className="size-3" aria-hidden />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs"
            render={
              <Link
                href={runsAgentFilterHref(run.agentId, hk)}
                scroll={false}
              />
            }
          >
            同 Agent Runs
          </Button>
        </div>
      </header>

      <CaseSection title="运行指标">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "耗时", value: formatDuration(run.durationSec) },
            { label: "模型成本", value: formatCost(run.costYuan) },
            { label: "模型", value: modelLabel(run.model) },
            { label: "版本", value: run.version },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-border bg-muted/20 px-3 py-2"
            >
              <dt className="text-muted-foreground text-[11px]">{item.label}</dt>
              <dd className="mt-0.5 text-sm font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CaseSection>

      <CaseSection title="业务影响">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-muted-foreground text-xs">关联对象</p>
            <p className="mt-1 font-mono text-sm font-semibold">
              {run.relatedObjectId}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {run.relatedObjectType}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-muted-foreground text-xs">Action 产出</p>
            <p className="mt-1 text-sm font-semibold">
              {run.actionGenerated ? "已生成 Action" : "未生成 Action"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {run.actionId ?? "无正式执行动作"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-muted-foreground text-xs">补救建议</p>
            <p className="mt-1 text-sm font-semibold">
              {run.status === "anomaly"
                ? "检查上下文源并补跑"
                : run.status === "retried"
                  ? "确认重试后的 Action 质量"
                  : "进入 Action 流转复核"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {run.errorSummary ?? "无阻断错误"}
            </p>
          </div>
        </div>
      </CaseSection>

      <CaseSection
        title="Pipeline 时间线"
        action={
          <span className="text-muted-foreground text-[10px]">
            调试 / 审计 / 信任
          </span>
        }
      >
        <ol className="space-y-2">
          {run.pipeline.map((stage, index) => (
            <PipelineStageRow
              key={stage.id}
              stage={stage}
              isLast={index === run.pipeline.length - 1}
              defaultOpen={
                index === failedStageIndex ||
                (failedStageIndex === -1 && index === run.pipeline.length - 1)
              }
            />
          ))}
        </ol>
      </CaseSection>

      <CaseSection title="运行日志">
        <pre className="bg-muted/40 max-h-48 overflow-auto rounded-lg border border-border p-3 font-mono text-[11px] leading-relaxed">
          {run.logs
            .map((line) => `[${line.at}] ${line.level} ${line.message}`)
            .join("\n")}
        </pre>
        <p className="text-muted-foreground mt-2 text-xs">
          <Link
            href={runDetailHref(run.id, hk)}
            className="hover:text-primary"
          >
            分享此 Run 链接
          </Link>
          {" · "}
          <Link
            href={runsEvaluationHref(run.agentId, hk)}
            className="hover:text-primary"
          >
            在效果评估中查看同 Agent 样本
          </Link>
        </p>
      </CaseSection>
    </div>
  );
}

export function RunsDetailEmpty() {
  return (
    <div className="text-muted-foreground flex h-full min-h-[16rem] flex-col items-center justify-center px-6 text-center text-sm">
      <p>选择左侧 Run 查看执行详情</p>
      <p className="mt-1 text-xs">
        含 Trigger → 输入快照 → 规则 → LLM → 工具 → 输出 → Action 全链路
      </p>
    </div>
  );
}
