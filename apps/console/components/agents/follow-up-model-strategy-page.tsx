"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronRight,
  Cpu,
  ExternalLink,
  Play,
  Sparkles,
} from "lucide-react";
import {
  AGENTS_HOME_PATH,
  agentDetailHref,
} from "@/lib/agents-nav";
import { AI_INFRASTRUCTURE_PATH } from "@/lib/settings-nav";
import type { ModelStrategyView } from "@/lib/adapters/follow-up-model-strategy";
import { taskRouteStatusClass } from "@/lib/follow-up-model-strategy-mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataStateBadge } from "@/components/data-state-badge";
import { AgentSettingsSubNav } from "./agent-settings-sub-nav";
import { SettingsSectionCard } from "./settings-section-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { testConnector } from "@/lib/runtime-config/client";

const ROUTE_STATUS_LABEL = {
  active: "运行中",
  standby: "待命",
  disabled: "未启用",
} as const;

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
      {children}
    </label>
  );
}

export function FollowUpModelStrategyPage({
  view,
}: {
  view: ModelStrategyView;
}) {
  const testRunRef = useRef<HTMLDivElement>(null);
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  async function runLlmTest() {
    setTestBusy(true);
    try {
      const res = await testConnector("llm");
      setTestResult(res.message);
      if (res.ok) toast.success("LLM 连接正常");
      else toast.error(res.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "测试失败");
    } finally {
      setTestBusy(false);
    }
  }

  const primary = view.primaryModel;

  return (
    <main className="shell-scroll min-h-0 h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-6 [scrollbar-gutter:stable] lg:px-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <header className="mb-4 space-y-4">
          <nav
            className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs"
            aria-label="面包屑"
          >
            <Link href={AGENTS_HOME_PATH} className="hover:text-foreground">
              Agents
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <Link
              href={agentDetailHref("follow-up")}
              className="hover:text-foreground"
            >
              Follow-up Agent
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <span className="text-foreground font-medium">模型策略</span>
          </nav>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                  <Cpu className="size-5" aria-hidden />
                </span>
                <h1 className="text-xl font-semibold tracking-tight">
                  模型策略
                </h1>
                <Badge variant="outline">{view.summary.configVersion}</Badge>
              </div>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                {primary.provider} / {primary.model} · {primary.agentModeLabel}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <DataStateBadge state="live" label="运行配置" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  testRunRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                  })
                }
              >
                验证
              </Button>
              <Button
                type="button"
                size="sm"
                render={<Link href={primary.editHref} />}
              >
                管理模型
              </Button>
            </div>
          </div>

          <AgentSettingsSubNav />
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_17.5rem] xl:items-start">
          <div className="space-y-4">
            <Card className="gap-0 overflow-hidden rounded-xl border-border py-0 shadow-sm">
              <CardContent className="space-y-4 px-5 py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl">
                      <Sparkles className="size-6" aria-hidden />
                    </span>
                    <div>
                      <h2 className="text-foreground text-base font-semibold">
                        当前模型
                      </h2>
                      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                        wedge 阶段使用单一全局 LLM；per-task 路由为引擎管线展示。
                      </p>
                    </div>
                  </div>
                  <Link
                    href={AI_INFRASTRUCTURE_PATH}
                    className="text-primary inline-flex shrink-0 items-center gap-1 text-xs font-medium hover:underline"
                  >
                    AI 基础设施
                    <ExternalLink className="size-3" aria-hidden />
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                    <dt className="text-muted-foreground text-xs">主模型</dt>
                    <dd className="text-foreground mt-1 text-sm font-medium">
                      {primary.provider} / {primary.model}
                    </dd>
                    <DataStateBadge state={primary.dataState} className="mt-1.5" />
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                    <dt className="text-muted-foreground text-xs">推理模式</dt>
                    <dd className="text-foreground mt-1 text-sm font-medium">
                      {primary.agentModeLabel}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 opacity-70">
                    <dt className="text-muted-foreground text-xs">备份模型</dt>
                    <dd className="text-foreground mt-1 text-sm font-medium">
                      {view.backupModel.label}
                    </dd>
                    <DataStateBadge
                      state={view.backupModel.dataState}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 opacity-70">
                    <dt className="text-muted-foreground text-xs">视觉模型</dt>
                    <dd className="text-foreground mt-1 text-sm font-medium">
                      {view.visionModel.label}
                    </dd>
                    <DataStateBadge
                      state={view.visionModel.dataState}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <SettingsSectionCard title="任务路由（引擎管线）">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>步骤</TableHead>
                    <TableHead>模型</TableHead>
                    <TableHead>降级</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.taskRoutes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.task}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {route.model}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {route.fallback}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={taskRouteStatusClass(
                            route.status === "active"
                              ? "enabled"
                              : route.status === "standby"
                                ? "grayscale"
                                : "disabled"
                          )}
                        >
                          {ROUTE_STATUS_LABEL[route.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SettingsSectionCard>

            <SettingsSectionCard title="运行约束">
              <div className="grid gap-3 sm:grid-cols-2">
                {view.constraints.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                  >
                    <div>
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.hint ? (
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {item.hint}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {item.enabled ? "开" : "关"}
                      </span>
                      <DataStateBadge state={item.dataState} />
                    </div>
                  </div>
                ))}
              </div>
            </SettingsSectionCard>

            <div className="grid gap-4 lg:grid-cols-2">
              <SettingsSectionCard title="Prompt 策略">
                <p className="text-foreground text-sm font-medium">
                  {view.prompt.name}
                </p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  {view.prompt.hint}
                </p>
              </SettingsSectionCard>

              <SettingsSectionCard title="评估指标（近 7 天）">
                {view.metrics ? (
                  <dl className="grid grid-cols-2 gap-3">
                    {[
                      ["Run 次数", view.metrics.runCount],
                      [
                        "平均延迟",
                        `${Math.round(view.metrics.avgLatencyMs)} ms`,
                      ],
                      ["Token 总量", view.metrics.totalTokens.toLocaleString()],
                      ["估算成本", `¥${view.metrics.estimatedCost.toFixed(2)}`],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-border bg-muted/20 px-3 py-2.5"
                      >
                        <dt className="text-muted-foreground text-xs">{label}</dt>
                        <dd className="text-foreground mt-1 text-lg font-semibold tabular-nums">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    暂无 trace 数据
                  </p>
                )}
              </SettingsSectionCard>
            </div>

            <div ref={testRunRef} className="scroll-mt-4">
              <SettingsSectionCard title="验证">
                <p className="text-muted-foreground mb-3 text-xs">
                  在 AI 基础设施页可编辑 provider；此处测试当前运行时 LLM 连接。
                </p>
                <Button
                  type="button"
                  disabled={testBusy}
                  onClick={runLlmTest}
                >
                  <Play className="size-4" aria-hidden />
                  测试 LLM 连接
                </Button>
                {testResult ? (
                  <p className="text-muted-foreground mt-3 text-xs">{testResult}</p>
                ) : null}
              </SettingsSectionCard>
            </div>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-4">
            <SettingsSectionCard title="配置摘要" bodyClassName="space-y-2.5">
              {[
                ["状态", view.summary.status],
                ["主模型", view.summary.primaryModel],
                ["版本", view.summary.configVersion],
                ["最近更新", view.summary.lastPublishedAt],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </SettingsSectionCard>

            <SettingsSectionCard title="发布历史" bodyClassName="space-y-3">
              {view.publishHistory.length ? (
                <ul className="space-y-3">
                  {view.publishHistory.slice(0, 5).map((item) => (
                    <li
                      key={item.version}
                      className="border-border border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline">{item.version}</Badge>
                        <span className="text-muted-foreground text-[11px]">
                          {item.at}
                        </span>
                      </div>
                      <p className="text-foreground mt-1 text-xs leading-relaxed">
                        {item.summary}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-xs">暂无修订记录</p>
              )}
            </SettingsSectionCard>
          </aside>
        </div>
      </div>
    </main>
  );
}
