"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CaseSection } from "@/components/case/case-section";
import { cn } from "@/lib/utils";
import {
  formatCost,
  formatDuration,
  modelLabel,
  type MockRun,
} from "@/lib/runs-mock";
import { myActionHref } from "@/lib/my-actions-mock";
import { workbenchPaneHref } from "@/lib/workbench-nav";
import { RunStatusBadge } from "./run-status-badge";

const LOG_TABS = [
  { id: "run", label: "运行日志" },
  { id: "llm", label: "LLM 日志" },
  { id: "tool", label: "工具调用" },
  { id: "json", label: "输出 JSON" },
] as const;

type LogTab = (typeof LOG_TABS)[number]["id"];

export function RunsDetailPanel({
  run,
  hk,
}: {
  run: MockRun;
  hk?: string;
}) {
  const [logTab, setLogTab] = useState<LogTab>("run");
  const listContext = { hk, from: "active" as const };

  return (
    <div className="space-y-4 p-4 lg:p-5">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-base font-semibold">{run.id}</h1>
          <RunStatusBadge status={run.status} />
          {run.analysisRound ? (
            <Badge variant="secondary">{run.analysisRound} 次分析</Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          {run.agentName} · {run.triggerSource} · {modelLabel(run.model)}
        </p>
        <div className="flex flex-wrap gap-2">
          {run.actionId ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs"
              render={
                <Link href={myActionHref(run.actionId, hk)} scroll={false} />
              }
            >
              查看 Action
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
                  href={workbenchPaneHref(run.workOrderKey, listContext)}
                  scroll={false}
                />
              }
            >
              查看 Agent 建议
              <ChevronRight className="size-3" aria-hidden />
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            render={<Link href={`/agents`} scroll={false} />}
          >
            查看 Agent
            <ExternalLink className="size-3" aria-hidden />
          </Button>
        </div>
      </header>

      <CaseSection title="运行步骤">
        <ol className="relative space-y-3 border-l border-border pl-4">
          {run.steps.map((step, index) => (
            <li key={`${step.at}-${index}`} className="relative">
              <span className="bg-primary absolute top-1.5 -left-[1.3rem] size-2 rounded-full" />
              <p className="text-muted-foreground font-mono text-[11px] tabular-nums">
                {step.at}
              </p>
              <p className="text-sm font-medium">{step.title}</p>
              {step.detail ? (
                <p className="text-muted-foreground mt-0.5 text-xs">{step.detail}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </CaseSection>

      <div className="grid gap-3 sm:grid-cols-2">
        <CaseSection title="输入上下文" bodyClassName="p-3">
          <dl className="space-y-2">
            {run.inputContext.map((item) => (
              <div key={item.label}>
                <dt className="text-muted-foreground text-[11px]">{item.label}</dt>
                <dd className="text-sm font-medium">{item.value}</dd>
              </div>
            ))}
          </dl>
        </CaseSection>
        <CaseSection title="输出结果" bodyClassName="p-3">
          <dl className="space-y-2">
            {run.outputResult.map((item) => (
              <div key={item.label}>
                <dt className="text-muted-foreground text-[11px]">{item.label}</dt>
                <dd className="text-sm font-medium">{item.value}</dd>
              </div>
            ))}
          </dl>
        </CaseSection>
      </div>

      <CaseSection title="运行指标">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "耗时", value: formatDuration(run.durationSec) },
            { label: "成本", value: formatCost(run.costYuan) },
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

      <CaseSection
        title="日志"
        action={
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs">
            查看完整日志
            <ExternalLink className="ml-1 size-3" aria-hidden />
          </Button>
        }
      >
        <div className="mb-3 flex flex-wrap gap-1 border-b border-border pb-2">
          {LOG_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLogTab(tab.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                logTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <pre className="bg-muted/40 max-h-48 overflow-auto rounded-lg border border-border p-3 font-mono text-[11px] leading-relaxed">
          {logTab === "run"
            ? run.logs
                .map(
                  (line) =>
                    `[${line.at}] ${line.level} ${line.message}`
                )
                .join("\n")
            : logTab === "llm"
              ? `// LLM 推理日志（演示）\nmodel=${modelLabel(run.model)}\ntokens_in=842 tokens_out=414\nlatency=${formatDuration(run.durationSec * 0.65)}`
              : logTab === "tool"
                ? `// 工具调用（演示）\ncrm.getOpportunity("${run.relatedObjectId}")\nfsm.getWorkOrder(...)\nstatus=ok`
                : JSON.stringify(
                    {
                      runId: run.id,
                      insight: run.outputResult[0]?.value,
                      actionGenerated: run.actionGenerated,
                      actionId: run.actionId,
                    },
                    null,
                    2
                  )}
        </pre>
      </CaseSection>
    </div>
  );
}

export function RunsDetailEmpty() {
  return (
    <div className="text-muted-foreground flex h-full min-h-[16rem] flex-col items-center justify-center px-6 text-center text-sm">
      <p>选择左侧 Run 查看执行详情</p>
      <p className="mt-1 text-xs">含触发、推理、工具调用与 Action 产出链路</p>
    </div>
  );
}
