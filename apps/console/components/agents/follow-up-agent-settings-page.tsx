"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Database,
  ExternalLink,
  History,
  Play,
  Settings2,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  AGENTS_HOME_PATH,
  FOLLOW_UP_MODEL_STRATEGY_PATH,
  agentDetailHref,
} from "@/lib/agents-nav";
import type {
  AgentSettingsDataState,
  AgentSettingsView,
} from "@/lib/adapters/follow-up-agent-settings";
import { AgentSettingsSubNav } from "./agent-settings-sub-nav";
import { TRIGGER_PRIORITY_LABEL } from "@/lib/follow-up-agent-settings-mock";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataStateBadge } from "@/components/data-state-badge";
import {
  rollbackRuntimeConfig,
  saveRuntimeConfig,
  type RuntimeConfigPublic,
} from "@/lib/runtime-config/client";
import { SettingsSectionCard } from "./settings-section-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
      {children}
    </label>
  );
}

function StateChip({ state }: { state: AgentSettingsDataState }) {
  if (state === "live") return <DataStateBadge state="live" label="已接入" />;
  if (state === "scenario")
    return <DataStateBadge state="scenario" label="规划" />;
  return <DataStateBadge state="not_connected" label="未接入" />;
}

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
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

export function FollowUpAgentSettingsPage({
  view,
  runtimeConfig = null,
  runtimeBootstrap = false,
}: {
  view: AgentSettingsView;
  runtimeConfig?: RuntimeConfigPublic | null;
  runtimeBootstrap?: boolean;
}) {
  const testRunRef = useRef<HTMLDivElement>(null);
  const [testWorkOrderId, setTestWorkOrderId] = useState("WO-2026-0412");
  const [lastTestRun, setLastTestRun] = useState<{
    workOrderId: string;
    at: string;
    outcome: string;
  } | null>(null);
  const [runtime, setRuntime] = useState(runtimeConfig);
  const [form, setForm] = useState(() => ({
    dry_run: runtimeConfig?.config.dry_run ?? true,
    agent_mode: runtimeConfig?.config.agent_mode ?? "steps",
    console_base_url: runtimeConfig?.config.console_base_url ?? "",
    reanalyze_enabled: runtimeConfig?.config.reanalyze_enabled ?? false,
  }));
  const [busy, setBusy] = useState(false);

  const canEdit = Boolean(runtime) && !runtimeBootstrap;

  async function handleSave() {
    if (!canEdit) return;
    setBusy(true);
    try {
      const next = await saveRuntimeConfig(form, "Agent 设置更新");
      setRuntime(next);
      setForm({
        dry_run: next.config.dry_run,
        agent_mode: next.config.agent_mode,
        console_base_url: next.config.console_base_url,
        reanalyze_enabled: next.config.reanalyze_enabled,
      });
      toast.success("已保存", { description: "下轮 cron 生效" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleRollback() {
    if (!runtime || runtime.version <= 1) {
      toast.message("无可回滚版本");
      return;
    }
    setBusy(true);
    try {
      const target = runtime.version - 1;
      const next = await rollbackRuntimeConfig(target);
      setRuntime(next);
      setForm({
        dry_run: next.config.dry_run,
        agent_mode: next.config.agent_mode,
        console_base_url: next.config.console_base_url,
        reanalyze_enabled: next.config.reanalyze_enabled,
      });
      toast.success(`已回滚到 v${target}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "回滚失败");
    } finally {
      setBusy(false);
    }
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
          count > 0 ? `找到 ${count} 条 trace` : "无 trace 记录",
      };
      setLastTestRun(result);
      toast.success("已查询 trace", { description: result.outcome });
    } catch {
      toast.error("查询 trace 失败");
    }
  }

  const sync = view.engineSync;

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
                <Badge
                  className={
                    view.basic.enabled
                      ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
                      : ""
                  }
                  variant={view.basic.enabled ? "default" : "secondary"}
                >
                  {view.summary.status}
                </Badge>
                <Badge variant="outline">{view.summary.configVersion}</Badge>
              </div>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                定义目标、触发条件、数据来源与人在回路规则
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
              {canEdit ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={handleRollback}
                  >
                    回滚
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={handleSave}
                  >
                    保存配置
                  </Button>
                </>
              ) : (
                <Badge variant="secondary">需配置加密密钥后编辑</Badge>
              )}
            </div>
          </div>

          <AgentSettingsSubNav />
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_17.5rem] xl:items-start">
          <div className="space-y-4">
            <SettingsSectionCard title="基础信息">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Agent 名称</FieldLabel>
                  <input
                    readOnly
                    value={view.basic.name}
                    className="border-input bg-muted/30 h-9 w-full rounded-lg border px-3 text-sm"
                  />
                </div>
                <div>
                  <FieldLabel>负责人</FieldLabel>
                  <input
                    readOnly
                    value={view.basic.owner}
                    className="border-input bg-muted/30 h-9 w-full rounded-lg border px-3 text-sm"
                  />
                </div>
                <div>
                  <FieldLabel>业务阶段</FieldLabel>
                  <input
                    readOnly
                    value={view.basic.businessStage}
                    className="border-input bg-muted/30 h-9 w-full rounded-lg border px-3 text-sm"
                  />
                </div>
                <div className="flex items-end justify-between gap-3 rounded-lg border border-border px-3 py-2">
                  <div>
                    <FieldLabel>运行状态</FieldLabel>
                    <p className="text-foreground text-sm font-medium">
                      {view.basic.lastCronAt
                        ? `上次 cron · ${new Date(view.basic.lastCronAt).toLocaleString("zh-CN")}`
                        : "等待首次 cron"}
                    </p>
                  </div>
                  <DataStateBadge
                    state={view.basic.enabled ? "live" : "not_connected"}
                  />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>描述</FieldLabel>
                  <textarea
                    readOnly
                    rows={3}
                    value={view.basic.description}
                    className="border-input bg-muted/30 w-full resize-none rounded-lg border px-3 py-2 text-sm leading-relaxed"
                  />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>服务线</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {view.basic.serviceLines.map((line) => (
                      <Badge key={line} variant="outline">
                        {line}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsSectionCard>

            <SettingsSectionCard
              title="摄取策略"
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  render={
                    <Link href={view.ingestionPolicies[0]?.editHref ?? "/integrations"} />
                  }
                >
                  在集成页编辑
                </Button>
              }
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>策略</TableHead>
                    <TableHead>方式</TableHead>
                    <TableHead>条件</TableHead>
                    <TableHead>优先级</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.ingestionPolicies.map((rule) => {
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
                          <StateChip state={rule.dataState} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {view.futureCapabilities.map((cap) => (
                    <TableRow key={cap.label} className="opacity-60">
                      <TableCell className="font-medium">{cap.label}</TableCell>
                      <TableCell className="text-muted-foreground">
                        未来能力
                      </TableCell>
                      <TableCell colSpan={2} className="text-muted-foreground text-xs">
                        v0.5+ 规则引擎
                      </TableCell>
                      <TableCell>
                        <DataStateBadge state="scenario" label="规划" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SettingsSectionCard>

            <SettingsSectionCard title="数据来源">
              <p className="text-muted-foreground mb-3 text-xs">
                数据来源由系统集成统一接入，点击可查看连接详情。
              </p>
              <div className="flex flex-wrap gap-2">
                {view.dataSources.map((source) => {
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
                      <StateChip state={source.dataState} />
                    </>
                  );
                  if (source.integrationHref) {
                    return (
                      <Link
                        key={source.id}
                        href={source.integrationHref}
                        className="border-border bg-muted/30 hover:border-primary/30 hover:bg-primary/5 flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors"
                      >
                        {content}
                      </Link>
                    );
                  }
                  return (
                    <div
                      key={source.id}
                      className="border-border bg-muted/30 flex items-center gap-2 rounded-lg border px-3 py-2"
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </SettingsSectionCard>

            <SettingsSectionCard
              title="动作与审批"
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  render={<Link href={view.actions.governanceHref} />}
                >
                  <Settings2 className="size-3.5" aria-hidden />
                  治理中心
                </Button>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <div className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Zap className="text-primary size-4" aria-hidden />
                    自动执行（无需审批）
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {view.actions.auto.map((action) => (
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
                    需人工审批
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {view.actions.manual.map((action) => (
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

            <SettingsSectionCard title="Prompt & 知识">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-foreground text-sm font-medium">
                    {view.prompt.strategyName}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {view.prompt.strategyHint}
                  </p>
                  <Link
                    href={view.prompt.modelsHref}
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
                    {view.prompt.knowledgeBases.map((kb) => (
                      <Badge key={kb.name} variant="outline" className="gap-1">
                        {kb.name}
                        <StateChip state={kb.dataState} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsSectionCard>

            <SettingsSectionCard title="通知与写回">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground text-xs">企微通知</dt>
                  <dd className="mt-2 flex items-center gap-2">
                    <Toggle
                      checked={!form.dry_run}
                      onChange={(on) =>
                        setForm((f) => ({ ...f, dry_run: !on }))
                      }
                      label="企微正式发送"
                      disabled={!canEdit || !view.notifications.wecomConfigured}
                    />
                    <span className="text-sm">
                      {form.dry_run ? "预览模式" : "正式发送"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">写回 CRM</dt>
                  <dd className="mt-2">
                    <StateChip state={view.notifications.writeBack.dataState} />
                    <p className="text-muted-foreground mt-1 text-xs">
                      {view.notifications.writeBack.label}
                    </p>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">免打扰时段</dt>
                  <dd className="mt-2">
                    <StateChip state={view.notifications.quietHours.dataState} />
                    <p className="text-muted-foreground mt-1 text-xs">
                      {view.notifications.quietHours.label}
                    </p>
                  </dd>
                </div>
              </dl>
            </SettingsSectionCard>

            {canEdit ? (
              <SettingsSectionCard title="运行行为">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-medium">
                    推理模式
                    <select
                      className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                      value={form.agent_mode}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, agent_mode: e.target.value }))
                      }
                    >
                      <option value="steps">分步推理</option>
                      <option value="oneshot">单次推理</option>
                    </select>
                  </label>
                  <label className="text-xs font-medium">
                    Console 深链 BASE URL
                    <input
                      className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                      value={form.console_base_url}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          console_base_url: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.reanalyze_enabled}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        reanalyze_enabled: e.target.checked,
                      }))
                    }
                  />
                  启用时间触发再分析
                </label>
              </SettingsSectionCard>
            ) : null}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-4">
            <SettingsSectionCard title="引擎同步" bodyClassName="space-y-3">
              <dl className="space-y-2.5 text-sm">
                {[
                  ["配置版本", `v${sync.configVersion}`],
                  ["引擎快照", sync.snapshotRunAt ? "已对齐" : "等待 cron"],
                  ["摄取状态", `${sync.ingestionStatusCount} 个`],
                  ["试点管家", sync.pilotCount ? `${sync.pilotCount} 人` : "全量"],
                  ["主模型", `${sync.llmProvider} / ${sync.llmModel}`],
                  ["企微", sync.dryRun ? "预览模式" : "正式发送"],
                  ["FSM 源", sync.fsmSource],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right text-xs font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </SettingsSectionCard>

            <SettingsSectionCard title="配置摘要" bodyClassName="space-y-3">
              <dl className="space-y-2.5 text-sm">
                {[
                  ["状态", view.summary.status],
                  ["接入系统", `${view.summary.connectedSystems} 个`],
                  ["摄取策略", `${view.summary.ingestionPolicies} 项`],
                  ["最近更新", view.summary.lastPublishedAt],
                  ["版本", view.summary.configVersion],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right font-medium tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
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
              ) : (
                <p className="text-muted-foreground text-xs">暂无修订记录</p>
              )}
            </SettingsSectionCard>

            <div ref={testRunRef} className="scroll-mt-4">
              <SettingsSectionCard title="验证" bodyClassName="space-y-3">
                <FieldLabel>工单号 trace 查询</FieldLabel>
                <input
                  value={testWorkOrderId}
                  onChange={(e) => setTestWorkOrderId(e.target.value)}
                  placeholder="WO-2026-0412"
                  className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <Button type="button" className="w-full" onClick={runTest}>
                  <Play className="size-4" aria-hidden />
                  查询 trace
                </Button>
                {lastTestRun ? (
                  <div className="bg-muted/40 rounded-lg border border-border p-3">
                    <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      <History className="size-3" aria-hidden />
                      {lastTestRun.at}
                    </div>
                    <Link
                      href={`/runs?rq=${encodeURIComponent(lastTestRun.workOrderId)}`}
                      className="text-primary mt-1 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                      {lastTestRun.workOrderId}
                      <ExternalLink className="size-3" aria-hidden />
                    </Link>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {lastTestRun.outcome}
                    </p>
                  </div>
                ) : null}
              </SettingsSectionCard>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
