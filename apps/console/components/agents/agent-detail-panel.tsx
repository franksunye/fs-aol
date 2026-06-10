"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Pause,
  Settings,
  UserCheck,
} from "lucide-react";
import type { MockAgent } from "@/lib/agents-mock";
import { AGENT_STATUS_LABEL, formatAgentYuan } from "@/lib/agents-mock";
import {
  agentModelStrategyHref,
  agentSettingsHref,
} from "@/lib/agents-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DataStateBadge, DataStateNote, type DataState } from "@/components/data-state-badge";

function agentDataState(agent: MockAgent): DataState {
  if (agent.id === "follow-up") return "live";
  if (agent.status === "draft") return "not_connected";
  return "scenario";
}

function DemoButton({
  children,
  variant = "outline",
  size = "default",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "icon";
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      title="未接入真实执行"
      onClick={() => {}}
    >
      {children}
    </Button>
  );
}

function InfoCard({
  title,
  accentClassName,
  children,
}: {
  title: string;
  accentClassName: string;
  children: ReactNode;
}) {
  return (
    <Card className="gap-3 rounded-xl border-border py-4 shadow-sm">
      <CardHeader className="border-b border-border px-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className={cn("h-4 w-1 rounded-full", accentClassName)} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">{children}</CardContent>
    </Card>
  );
}

export function AgentDetailPanel({ agent }: { agent: MockAgent }) {
  const Icon = agent.icon;

  return (
    <div className="space-y-4">
      <Card className="gap-4 rounded-xl border-border py-5 shadow-sm">
        <CardContent className="px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <span
                className={cn(
                  "flex size-14 shrink-0 items-center justify-center rounded-xl",
                  agent.iconClassName
                )}
              >
                <Icon className="size-7" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-foreground text-xl font-semibold tracking-tight">
                    {agent.name}
                  </h2>
                  {agent.status === "enabled" ? (
                    <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
                      {AGENT_STATUS_LABEL[agent.status]}
                    </Badge>
                  ) : agent.status === "draft" ? (
                    <Badge variant="secondary">
                      {AGENT_STATUS_LABEL[agent.status]}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {AGENT_STATUS_LABEL[agent.status]}
                    </Badge>
                  )}
                  <Badge variant="outline">{agent.businessLine}</Badge>
                  <DataStateBadge
                    state={agentDataState(agent)}
                    label={
                      agent.id === "follow-up"
                        ? "真实运行"
                        : agent.status === "draft"
                          ? "规划中"
                          : "场景样例"
                    }
                  />
                  {agent.beta ? <Badge variant="secondary">Beta</Badge> : null}
                </div>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
                  {agent.description}
                </p>
                {agent.id !== "follow-up" ? (
                  <DataStateNote className="mt-2 max-w-2xl">
                    该 Agent 用于展示 AOL 可复用到其他业务阶段的形态；上线前需完成真实数据源、审批规则与执行写回接入。
                  </DataStateNote>
                ) : (
                  <DataStateNote className="mt-2 max-w-2xl">
                    当前真实楔子：从工单/报价上下文生成 Follow-up 建议，经人工审批后进入执行闭环。
                  </DataStateNote>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {agent.id === "follow-up" ? (
                <Button type="button" render={<Link href="/" />}>
                  进入 Action中心
                </Button>
              ) : (
                <DemoButton variant="default">进入 Action中心</DemoButton>
              )}
              {agentModelStrategyHref(agent.id) ? (
                <Button
                  type="button"
                  variant="outline"
                  render={<Link href={agentModelStrategyHref(agent.id)!} />}
                >
                  模型策略
                </Button>
              ) : null}
              {agentSettingsHref(agent.id) ? (
                <Button
                  type="button"
                  variant="outline"
                  render={<Link href={agentSettingsHref(agent.id)!} />}
                >
                  <Settings className="size-4" aria-hidden />
                  设置
                </Button>
              ) : (
                <DemoButton variant="outline">
                  <Settings className="size-4" aria-hidden />
                  设置
                </DemoButton>
              )}
              <DemoButton variant="outline" size="icon" className="text-destructive">
                <Pause className="size-4" aria-hidden />
              </DemoButton>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard title="职责范围" accentClassName="bg-primary">
          <ul className="text-muted-foreground space-y-1.5 text-sm">
            {agent.scope.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-primary mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
        <InfoCard title="触发条件" accentClassName="bg-emerald-500">
          <ul className="text-muted-foreground space-y-1.5 text-sm">
            {agent.triggers.map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2
                  className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
        <InfoCard title="接入系统" accentClassName="bg-sky-500">
          <div className="flex flex-wrap gap-2">
            {agent.systems.map((sys) => (
              <span
                key={sys}
                className="bg-muted text-foreground rounded-md px-2.5 py-1 text-xs font-medium"
              >
                {sys}
              </span>
            ))}
          </div>
        </InfoCard>
        <InfoCard title="效果概览" accentClassName="bg-amber-500">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">近 7 日建议</dt>
              <dd className="font-semibold tabular-nums">
                {agent.metrics.suggestions7d}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">采纳率</dt>
              <dd className="font-semibold tabular-nums">
                {agent.metrics.adoptionRate}%
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">推动金额</dt>
              <dd className="font-semibold tabular-nums">
                {agent.metrics.drivenAmount > 0
                  ? formatAgentYuan(agent.metrics.drivenAmount)
                  : "—"}
              </dd>
            </div>
          </dl>
        </InfoCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <InfoCard title="最近运行" accentClassName="bg-violet-500">
          {agent.recentRuns.length === 0 ? (
            <p className="text-muted-foreground text-sm">暂无运行记录</p>
          ) : (
            <ul className="space-y-3">
              {agent.recentRuns.map((run) => (
                <li
                  key={`${run.workOrderId}-${run.at}`}
                  className="border-border border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {run.at}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        run.outcomeTone === "success"
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      )}
                    >
                      {run.outcome}
                    </span>
                  </div>
                  <Link
                    href="/"
                    className="text-primary mt-1 inline-block text-sm font-medium hover:underline"
                  >
                    {run.workOrderId}
                  </Link>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {run.summary}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="text-primary mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline"
            title="Run 列表按当前接入状态展示"
          >
            查看全部
            <ArrowRight className="size-3" aria-hidden />
          </button>
        </InfoCard>

        <InfoCard title="能力边界" accentClassName="bg-rose-500">
          <div className="space-y-4">
            <div>
              <div className="text-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold">
                <Bot className="text-primary size-3.5" aria-hidden />
                Agent 可自主完成
              </div>
              <div className="flex flex-wrap gap-2">
                {agent.autonomous.map((item) => (
                  <span
                    key={item}
                    className="bg-primary/5 text-foreground rounded-md border border-primary/15 px-2.5 py-1 text-xs"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold">
                <UserCheck className="size-3.5 text-amber-600" aria-hidden />
                需要人工审批
              </div>
              <div className="flex flex-wrap gap-2">
                {agent.humanApproval.map((item) => (
                  <span
                    key={item}
                    className="bg-muted text-foreground rounded-md px-2.5 py-1 text-xs"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="text-primary mt-4 inline-flex items-center gap-1 text-xs font-medium hover:underline"
            title="能力说明暂未接入完整文档"
          >
            查看详细能力说明
            <ArrowRight className="size-3" aria-hidden />
          </button>
        </InfoCard>
      </div>
    </div>
  );
}
