"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowRight,
  ChevronRight,
  Cpu,
  ExternalLink,
  Pencil,
  Play,
  Sparkles,
} from "lucide-react";
import {
  AGENTS_HOME_PATH,
  agentDetailHref,
} from "@/lib/agents-nav";
import { AI_INFRASTRUCTURE_PATH } from "@/lib/settings-nav";
import {
  FOLLOW_UP_MODEL_STRATEGY_MOCK,
  TASK_ROUTE_STATUS_LABEL,
  taskRouteStatusClass,
  type MockRuntimeConstraint,
} from "@/lib/follow-up-model-strategy-mock";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

function MockToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "bg-primary" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "bg-background size-4 rounded-full shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function DemoButton({
  children,
  variant = "outline",
  size = "sm",
  onClick,
}: {
  children: ReactNode;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default";
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={
        onClick ??
        (() =>
          toast.message("模型策略操作暂未接入真实发布", {
            description: "模型策略控制面尚未接入真实发布",
          }))
      }
    >
      {children}
    </Button>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
      {children}
    </label>
  );
}

export function FollowUpModelStrategyPage() {
  const mock = FOLLOW_UP_MODEL_STRATEGY_MOCK;
  const [constraints, setConstraints] = useState<MockRuntimeConstraint[]>(
    mock.constraints.map((item) => ({ ...item }))
  );
  const [testWorkOrderId, setTestWorkOrderId] = useState("WO-2026-0412");
  const [testTask, setTestTask] = useState(mock.testTasks[0].id);
  const [testVersion, setTestVersion] = useState(mock.testVersions[0]);
  const [lastTestRun, setLastTestRun] = useState(mock.lastTestRun);
  const testRunRef = useRef<HTMLDivElement>(null);

  function toggleConstraint(id: string) {
    setConstraints((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  }

  function runTest() {
    const taskLabel =
      mock.testTasks.find((t) => t.id === testTask)?.label ?? testTask;
    const result = {
      ...mock.lastTestRun,
      workOrderId: testWorkOrderId.trim() || "WO-2026-0412",
      task: taskLabel,
      version: testVersion,
      at: "刚刚",
      duration: "4.6s",
    };
    setLastTestRun(result);
    toast.success("测试运行完成（演示）", {
      description: `${result.workOrderId} · ${taskLabel}`,
    });
  }

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
                <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
                  已启用
                </Badge>
                <Badge variant="outline">Revenue</Badge>
                <Badge variant="secondary">{mock.version}</Badge>
              </div>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                为各任务节点选择模型、约束与评估方式（策略样例，暂未接入真实发布）
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DemoButton
                variant="outline"
                onClick={() =>
                  testRunRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                  })
                }
              >
                测试运行
              </DemoButton>
              <DemoButton
                onClick={() =>
                  toast.message("草稿已保存（演示）", {
                    description: mock.version,
                  })
                }
              >
                保存草稿
              </DemoButton>
              <DemoButton
                variant="default"
                onClick={() =>
                  toast.success("策略已发布（演示）", {
                    description: mock.version,
                  })
                }
              >
                发布配置
              </DemoButton>
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
                        Follow-up Agent
                      </h2>
                      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                        {mock.infraNote}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={AI_INFRASTRUCTURE_PATH}
                    className="text-primary inline-flex shrink-0 items-center gap-1 text-xs font-medium hover:underline"
                  >
                    管理供应商
                    <ExternalLink className="size-3" aria-hidden />
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["主模型", mock.models.primary.name, mock.models.primary.tag],
                    ["备份模型", mock.models.backup.name, null],
                    ["视觉模型", mock.models.vision.name, null],
                  ].map(([label, value, tag]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-border bg-muted/20 px-3 py-2.5"
                    >
                      <dt className="text-muted-foreground text-xs">{label}</dt>
                      <dd className="text-foreground mt-1 text-sm font-medium">
                        {value}
                      </dd>
                      {tag ? (
                        <Badge variant="outline" className="mt-1.5 text-[10px]">
                          {tag}
                        </Badge>
                      ) : null}
                    </div>
                  ))}
                  <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                    <dt className="text-muted-foreground text-xs">运行参数</dt>
                    <dd className="text-foreground mt-1 space-y-0.5 text-sm font-medium">
                      <div>温度 {mock.models.temperature}</div>
                      <div className="text-muted-foreground text-xs font-normal">
                        单次成本上限 {mock.models.costLimit} · 超时{" "}
                        {mock.models.timeout}
                      </div>
                    </dd>
                  </div>
                </div>
              </CardContent>
            </Card>

            <SettingsSectionCard title="任务路由">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>任务节点</TableHead>
                    <TableHead>使用 LLM</TableHead>
                    <TableHead>模型策略</TableHead>
                    <TableHead>输出格式</TableHead>
                    <TableHead>回退模型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mock.taskRoutes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.task}</TableCell>
                      <TableCell>
                        {route.usesLlm ? (
                          <span className="text-emerald-600 text-xs font-medium">
                            是
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">否</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {route.model ? (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-sm">{route.model}</span>
                            {route.modelTag ? (
                              <Badge variant="outline" className="text-[10px]">
                                {route.modelTag}
                              </Badge>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {route.outputFormat}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {route.fallback ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={taskRouteStatusClass(route.status)}>
                          {TASK_ROUTE_STATUS_LABEL[route.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`编辑 ${route.task}`}
                          onClick={() =>
                            toast.message("任务路由暂未接入真实发布", {
                              description: `策略样例：${route.task}`,
                            })
                          }
                        >
                          <Pencil className="size-3.5" aria-hidden />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SettingsSectionCard>

            <SettingsSectionCard title="运行约束">
              <div className="grid gap-3 sm:grid-cols-2">
                {constraints.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                    <MockToggle
                      checked={item.enabled}
                      onChange={() => toggleConstraint(item.id)}
                      label={item.label}
                    />
                  </div>
                ))}
              </div>
            </SettingsSectionCard>

            <div className="grid gap-4 lg:grid-cols-2">
              <SettingsSectionCard
                title="Prompt 策略"
                action={
                  <DemoButton size="sm">查看并编辑 Prompt</DemoButton>
                }
              >
                <p className="text-muted-foreground text-sm leading-relaxed">
                  策略 {mock.prompt.version} · {mock.prompt.summary}
                </p>
              </SettingsSectionCard>

              <SettingsSectionCard title="评估指标">
                <dl className="grid grid-cols-2 gap-3">
                  {mock.metrics.map((metric) => (
                    <div
                      key={metric.id}
                      className="rounded-lg border border-border bg-muted/20 px-3 py-2.5"
                    >
                      <dt className="text-muted-foreground text-xs">
                        {metric.label}
                      </dt>
                      <dd className="text-foreground mt-1 text-lg font-semibold tabular-nums">
                        {metric.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </SettingsSectionCard>
            </div>

            <div ref={testRunRef} className="scroll-mt-4">
              <SettingsSectionCard title="测试运行">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <FieldLabel>工单号</FieldLabel>
                    <input
                      value={testWorkOrderId}
                      onChange={(e) => setTestWorkOrderId(e.target.value)}
                      className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </div>
                  <div>
                    <FieldLabel>测试任务</FieldLabel>
                    <select
                      value={testTask}
                      onChange={(e) => setTestTask(e.target.value)}
                      className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
                    >
                      {mock.testTasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>配置版本</FieldLabel>
                    <select
                      value={testVersion}
                      onChange={(e) => setTestVersion(e.target.value)}
                      className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
                    >
                      {mock.testVersions.map((version) => (
                        <option key={version} value={version}>
                          {version}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button type="button" className="mt-3" onClick={runTest}>
                  <Play className="size-4" aria-hidden />
                  运行一次
                </Button>
                <div className="bg-muted/40 mt-4 rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
                      {lastTestRun.outcome}
                    </Badge>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {lastTestRun.duration} · {lastTestRun.model} ·{" "}
                      {lastTestRun.at}
                    </span>
                  </div>
                  <Link
                    href="/"
                    className="text-primary mt-2 inline-block text-sm font-medium hover:underline"
                  >
                    {lastTestRun.workOrderId}
                  </Link>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {lastTestRun.summary}
                  </p>
                  <button
                    type="button"
                    className="text-primary mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline"
                  >
                    查看完整结果
                    <ArrowRight className="size-3" aria-hidden />
                  </button>
                </div>
              </SettingsSectionCard>
            </div>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-4">
            <SettingsSectionCard title="配置摘要" bodyClassName="space-y-2.5">
              {[
                ["主模型", mock.summary.primaryModel],
                ["备份模型", mock.summary.backupModel],
                ["版本", mock.summary.version],
                ["最近发布", mock.summary.lastPublishedAt],
                ["发布人", mock.summary.publisher],
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

            <SettingsSectionCard title="模型可用性" bodyClassName="space-y-2">
              <p className="text-muted-foreground mb-2 text-xs">
                来自{" "}
                <Link href={AI_INFRASTRUCTURE_PATH} className="text-primary hover:underline">
                  AI 基础设施
                </Link>
              </p>
              {mock.availability.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span>{item.name}</span>
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      item.available ? "bg-emerald-500" : "bg-red-500"
                    )}
                    aria-label={item.available ? "可用" : "不可用"}
                  />
                </div>
              ))}
            </SettingsSectionCard>

            <SettingsSectionCard
              title="发布历史"
              action={
                <button
                  type="button"
                  className="text-primary text-xs font-medium hover:underline"
                >
                  查看全部版本
                </button>
              }
              bodyClassName="space-y-3"
            >
              <ul className="space-y-3">
                {mock.publishHistory.map((item) => (
                  <li
                    key={item.version}
                    className="border-border border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">{item.version}</Badge>
                      <span className="text-muted-foreground text-[11px]">
                        {item.by}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-[11px] tabular-nums">
                      {item.at}
                    </p>
                    <p className="text-foreground mt-1 text-xs leading-relaxed">
                      {item.summary}
                    </p>
                  </li>
                ))}
              </ul>
            </SettingsSectionCard>
          </aside>
        </div>
      </div>
    </main>
  );
}
