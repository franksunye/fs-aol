"use client";

import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Database,
  History,
  Mail,
  MessageSquare,
  Pencil,
  Play,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import {
  AGENTS_HOME_PATH,
  FOLLOW_UP_MODEL_STRATEGY_PATH,
  agentDetailHref,
} from "@/lib/agents-nav";
import {
  INTEGRATIONS_HOME_PATH,
  integrationHref,
} from "@/lib/integrations-nav";
import { AGENT_DATA_SOURCE_INTEGRATION } from "@/lib/integrations-mock";
import { AgentSettingsSubNav } from "./agent-settings-sub-nav";
import {
  FOLLOW_UP_SETTINGS_MOCK,
  TRIGGER_PRIORITY_LABEL,
  type MockTestRun,
  type MockTriggerRule,
} from "@/lib/follow-up-agent-settings-mock";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataStateBadge } from "@/components/data-state-badge";
import type { EngineRuntimeSnapshot } from "@/lib/tracking/engine-runtime";
import { FollowUpRuntimeMirrorCard } from "./follow-up-runtime-mirror-card";
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

function DemoActionButton({
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
          toast.message("配置动作暂未接入真实发布", {
            description: "当前为 Follow-up Agent 配置样例",
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

export function FollowUpAgentSettingsPage({
  runtime = null,
}: {
  runtime?: EngineRuntimeSnapshot | null;
}) {
  const mock = FOLLOW_UP_SETTINGS_MOCK;
  const [enabled, setEnabled] = useState(mock.basic.enabled);
  const [rules, setRules] = useState<MockTriggerRule[]>(
    mock.triggerRules.map((rule) => ({ ...rule }))
  );
  const [testWorkOrderId, setTestWorkOrderId] = useState("WO-2026-0412");
  const [lastTestRun, setLastTestRun] = useState<MockTestRun>(mock.lastTestRun);
  const testRunRef = useRef<HTMLDivElement>(null);

  const enabledRuleCount = useMemo(
    () => rules.filter((rule) => rule.enabled).length,
    [rules]
  );

  function toggleRule(id: string) {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  }

  async function runTest() {
    const id = testWorkOrderId.trim();
    if (!id) {
      toast.error("请输入工单 ID");
      return;
    }
    try {
      const res = await fetch(`/api/traces/${encodeURIComponent(id)}`);
      if (!res.ok) {
        toast.error("未找到该工单的 trace", { description: id });
        return;
      }
      const data = (await res.json()) as { traces?: unknown[] };
      const count = Array.isArray(data.traces) ? data.traces.length : 0;
      const result = {
        workOrderId: id,
        at: "刚刚",
        outcome:
          count > 0
            ? `找到 ${count} 条真实 trace`
            : "无 trace 记录",
      };
      setLastTestRun(result);
      toast.success("已查询真实 trace", { description: result.outcome });
    } catch {
      toast.error("查询 trace 失败");
    }
  }

  return (
    <main className="shell-scroll min-h-0 h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-gutter:stable]">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8">
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
            <span className="text-foreground font-medium">设置</span>
          </nav>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                  <Sparkles className="size-5" aria-hidden />
                </span>
                <h1 className="text-xl font-semibold tracking-tight">
                  Follow-up Agent 设置
                </h1>
                <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
                  已启用
                </Badge>
                <Badge variant="outline">Revenue</Badge>
                <Badge variant="secondary">{mock.version}</Badge>
              </div>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                定义目标、触发条件、数据来源与人在回路规则
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <DataStateBadge state="live" label="运行时镜像" />
                <DataStateBadge state="not_connected" label="配置写回未接入" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DemoActionButton
                variant="outline"
                onClick={() => {
                  testRunRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                  });
                }}
              >
                测试运行
              </DemoActionButton>
              <DemoActionButton
                variant="outline"
                onClick={() =>
                  toast.message("草稿已保存（演示）", {
                    description: "配置尚未发布到生产环境",
                  })
                }
              >
                保存草稿
              </DemoActionButton>
              <DemoActionButton
                variant="default"
                onClick={() =>
                  toast.success("配置已发布（演示）", {
                    description: mock.version,
                  })
                }
              >
                发布配置
              </DemoActionButton>
            </div>
          </div>

          <AgentSettingsSubNav />
        </header>

        <FollowUpRuntimeMirrorCard runtime={runtime} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_17.5rem] xl:items-start">
          <div className="space-y-4">
            <SettingsSectionCard title="基础信息">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Agent 名称</FieldLabel>
                  <input
                    readOnly
                    value={mock.basic.name}
                    className="border-input bg-muted/30 h-9 w-full rounded-lg border px-3 text-sm"
                  />
                </div>
                <div>
                  <FieldLabel>负责人</FieldLabel>
                  <select
                    className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
                    defaultValue={mock.basic.owner}
                    aria-label="负责人"
                  >
                    <option>{mock.basic.owner}</option>
                    <option>李管家</option>
                    <option>王主管</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>业务阶段</FieldLabel>
                  <select
                    className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
                    defaultValue="follow-up"
                    aria-label="业务阶段"
                  >
                    <option value="follow-up">{mock.basic.businessStage}</option>
                    <option value="quote">报价阶段</option>
                    <option value="sign">签约阶段</option>
                  </select>
                </div>
                <div className="flex items-end justify-between gap-3 rounded-lg border border-border px-3 py-2">
                  <div>
                    <FieldLabel>启用状态</FieldLabel>
                    <p className="text-foreground text-sm font-medium">
                      {enabled ? "已启用" : "已停用"}
                    </p>
                  </div>
                  <MockToggle
                    checked={enabled}
                    onChange={setEnabled}
                    label="启用 Follow-up Agent"
                  />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>描述</FieldLabel>
                  <textarea
                    readOnly
                    rows={3}
                    value={mock.basic.description}
                    className="border-input bg-muted/30 w-full resize-none rounded-lg border px-3 py-2 text-sm leading-relaxed"
                  />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>服务线</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {mock.basic.serviceLines.map((line) => (
                      <Badge key={line} variant="outline">
                        {line}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsSectionCard>

            <SettingsSectionCard
              title="触发规则"
              action={
                <DemoActionButton size="sm">
                  <Plus className="size-3.5" aria-hidden />
                  新增规则
                </DemoActionButton>
              }
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>规则名称</TableHead>
                    <TableHead>触发方式</TableHead>
                    <TableHead>阈值 / 条件</TableHead>
                    <TableHead>优先级</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => {
                    const priority = TRIGGER_PRIORITY_LABEL[rule.priority];
                    return (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {rule.mode}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[14rem] whitespace-normal">
                          {rule.condition}
                        </TableCell>
                        <TableCell>
                          <Badge className={priority.className}>
                            {priority.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <MockToggle
                            checked={rule.enabled}
                            onChange={() => toggleRule(rule.id)}
                            label={`${rule.name} 启用状态`}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`编辑 ${rule.name}`}
                              onClick={() =>
                                toast.message("规则编辑暂未接入真实发布", {
                                  description: `配置样例：${rule.name}`,
                                })
                              }
                            >
                              <Pencil className="size-3.5" aria-hidden />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive"
                              aria-label={`删除 ${rule.name}`}
                              onClick={() =>
                                toast.message("规则删除暂未接入真实发布", {
                                  description: `配置样例：${rule.name}`,
                                })
                              }
                            >
                              <Trash2 className="size-3.5" aria-hidden />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </SettingsSectionCard>

            <SettingsSectionCard
              title="数据来源"
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  render={<Link href={INTEGRATIONS_HOME_PATH} />}
                >
                  管理系统集成
                </Button>
              }
            >
              <p className="text-muted-foreground mb-3 text-xs">
                数据来源由系统集成统一接入，点击可查看连接详情。
              </p>
              <div className="flex flex-wrap gap-2">
                {mock.dataSources.map((source) => {
                  const integrationId =
                    AGENT_DATA_SOURCE_INTEGRATION[source.id];
                  const content = (
                    <>
                      <Database
                        className="text-muted-foreground size-3.5"
                        aria-hidden
                      />
                      <span className="text-sm font-medium">{source.name}</span>
                      {source.permissions.map((perm) => (
                        <Badge
                          key={perm}
                          variant={perm === "写" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {perm}
                        </Badge>
                      ))}
                    </>
                  );
                  if (!integrationId) {
                    return (
                      <div
                        key={source.id}
                        className="border-border bg-muted/30 flex items-center gap-2 rounded-lg border px-3 py-2"
                      >
                        {content}
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={source.id}
                      href={integrationHref(integrationId)}
                      className="border-border bg-muted/30 hover:border-primary/30 hover:bg-primary/5 flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors"
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </SettingsSectionCard>

            <SettingsSectionCard
              title="动作与审批"
              action={
                <DemoActionButton size="sm">
                  <Settings2 className="size-3.5" aria-hidden />
                  配置审批矩阵
                </DemoActionButton>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <div className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Zap className="text-primary size-4" aria-hidden />
                    自动执行（无需审批）
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mock.actions.auto.map((action) => (
                      <span
                        key={action}
                        className="bg-primary/5 text-foreground rounded-md border border-primary/15 px-2.5 py-1 text-xs"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Bell className="size-4 text-amber-600" aria-hidden />
                    需人工审批（高风险操作）
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mock.actions.manual.map((action) => (
                      <span
                        key={action}
                        className="bg-muted text-foreground rounded-md px-2.5 py-1 text-xs"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsSectionCard>

            <SettingsSectionCard
              title="Prompt & 知识"
              action={
                <DemoActionButton size="sm">
                  <BookOpen className="size-3.5" aria-hidden />
                  管理知识
                </DemoActionButton>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-foreground text-sm font-medium">
                    {mock.prompt.strategyName}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    策略 {mock.prompt.strategyVersion} · {mock.prompt.strategyHint}
                  </p>
                  <Link
                    href={FOLLOW_UP_MODEL_STRATEGY_PATH}
                    className="text-primary mt-3 inline-block text-xs font-medium hover:underline"
                  >
                    查看模型策略 →
                  </Link>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-foreground mb-2 text-sm font-medium">
                    知识库
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mock.prompt.knowledgeBases.map((kb) => (
                      <Badge key={kb} variant="outline">
                        {kb}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsSectionCard>

            <SettingsSectionCard
              title="通知与写回"
              action={<DemoActionButton size="sm">编辑</DemoActionButton>}
            >
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-muted-foreground text-xs">通知渠道</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {mock.notifications.channels.map((ch) => (
                      <span
                        key={ch.id}
                        className="bg-muted inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                        title={ch.hint}
                      >
                        {ch.id === "email" ? (
                          <Mail className="size-3" aria-hidden />
                        ) : ch.id === "wecom" ? (
                          <MessageSquare className="size-3" aria-hidden />
                        ) : (
                          <Bell className="size-3" aria-hidden />
                        )}
                        {ch.label}
                      </span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">推送频率</dt>
                  <dd className="mt-2 text-sm font-medium">
                    {mock.notifications.frequency}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">写回权限</dt>
                  <dd className="mt-2 text-sm font-medium">
                    {mock.notifications.writeBack}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">免打扰时段</dt>
                  <dd className="mt-2 text-sm font-medium tabular-nums">
                    {mock.notifications.quietHours}
                  </dd>
                </div>
              </dl>
            </SettingsSectionCard>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-4">
            <SettingsSectionCard title="配置摘要" bodyClassName="space-y-3">
              <dl className="space-y-2.5 text-sm">
                {[
                  ["状态", enabled ? "已启用" : "已停用"],
                  ["接入系统", `${mock.summary.connectedSystems} 个`],
                  ["触发规则", `${enabledRuleCount} / ${rules.length} 条启用`],
                  ["自动动作", `${mock.summary.autoActions} 项`],
                  ["审批动作", `${mock.summary.approvalActions} 项`],
                  ["最近发布", mock.summary.lastPublishedAt],
                  ["版本", mock.summary.version],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right font-medium tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </SettingsSectionCard>

            <SettingsSectionCard
              title="发布历史"
              action={
                <button
                  type="button"
                  className="text-primary text-xs font-medium hover:underline"
                  onClick={() =>
                    toast.message("发布历史暂未接入真实记录", {
                      description: "当前展示配置样例",
                    })
                  }
                >
                  查看全部
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
                      <span className="text-muted-foreground text-[11px] tabular-nums">
                        {item.at}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                      {item.summary}
                    </p>
                  </li>
                ))}
              </ul>
            </SettingsSectionCard>

            <div ref={testRunRef} className="scroll-mt-4">
            <SettingsSectionCard title="测试运行" bodyClassName="space-y-3">
              <FieldLabel>工单号</FieldLabel>
              <input
                value={testWorkOrderId}
                onChange={(e) => setTestWorkOrderId(e.target.value)}
                placeholder="WO-2026-0412"
                className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button type="button" className="w-full" onClick={runTest}>
                <Play className="size-4" aria-hidden />
                运行一次
              </Button>
              <div className="bg-muted/40 rounded-lg border border-border p-3">
                <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                  <History className="size-3" aria-hidden />
                  上次运行 · {lastTestRun.at}
                </div>
                <Link
                  href="/"
                  className="text-primary mt-1 inline-block text-sm font-medium hover:underline"
                >
                  {lastTestRun.workOrderId}
                </Link>
                <p className="text-muted-foreground mt-1 text-xs">
                  {lastTestRun.outcome}
                </p>
              </div>
            </SettingsSectionCard>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
