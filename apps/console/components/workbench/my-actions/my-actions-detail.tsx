"use client";

import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronRight,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
  Send,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CaseSection } from "@/components/case/case-section";
import {
  formatDueLabel,
  isDueToday,
  type MyAction,
} from "@/lib/my-actions-mock";
import {
  ActionFlowPriorityBadge,
  ActionFlowStatusBadge,
} from "./action-flow-badges";
import { calendarHref } from "@/lib/calendar-nav";
import { workbenchPaneHref } from "@/lib/workbench-nav";

export function MyActionsDetail({
  action,
  hk,
}: {
  action: MyAction;
  hk?: string;
}) {
  const listContext = { hk, from: "active" as const };

  return (
    <div className="space-y-4 p-4 lg:p-5">
      <header className="space-y-3">
        <h1 className="text-lg font-semibold leading-snug">{action.title}</h1>
        <div className="flex flex-wrap gap-1.5">
          <ActionFlowPriorityBadge priority={action.priority} />
          <ActionFlowStatusBadge status={action.status} />
          {isDueToday(action) ? (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-amber-800"
            >
              今日到期
            </Badge>
          ) : null}
          {(action.status === "timeout" || action.status === "no_feedback") && (
            <Badge variant="destructive">异常关注</Badge>
          )}
          <Badge variant="secondary">来自 {action.sourceAgent}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => toast.message("跳转终端任务（演示）")}
          >
            <ExternalLink className="size-3.5" aria-hidden />
            查看终端任务
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => toast.success("已发送催办（演示）")}
          >
            <Send className="size-3.5" aria-hidden />
            催办
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => toast.message("重新分发功能即将开放")}
          >
            <RefreshCw className="size-3.5" aria-hidden />
            重新分发
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => toast.message("撤回功能即将开放")}
          >
            <Undo2 className="size-3.5" aria-hidden />
            撤回
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => toast.success("已标记异常（演示）")}
          >
            <AlertTriangle className="size-3.5" aria-hidden />
            标记异常
          </Button>
          <Button type="button" size="icon-sm" variant="outline" aria-label="更多">
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        </div>
      </header>

      <CaseSection title="Action 内容">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {action.goal}
        </p>
      </CaseSection>

      <CaseSection title="分发与执行状态">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <dt className="text-muted-foreground text-[11px]">分发目标</dt>
            <dd className="mt-0.5 text-sm font-medium">{action.dispatchTarget}</dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <dt className="text-muted-foreground text-[11px]">目标执行人</dt>
            <dd className="mt-0.5 text-sm font-medium">{action.assignee}</dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <dt className="text-muted-foreground text-[11px]">来源 Agent</dt>
            <dd className="mt-0.5 text-sm font-medium">{action.sourceAgent}</dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <dt className="text-muted-foreground text-[11px]">来源业务对象</dt>
            <dd className="mt-0.5 text-sm font-medium">
              {action.target.name}（{action.target.type}）
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <dt className="text-muted-foreground text-[11px]">创建时间</dt>
            <dd className="mt-0.5 text-sm font-medium">{action.createdAt}</dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <dt className="text-muted-foreground text-[11px]">截止时间</dt>
            <dd className="mt-0.5 text-sm font-medium tabular-nums">
              {formatDueLabel(action.dueDate, action.dueTime)}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <dt className="text-muted-foreground text-[11px]">当前状态</dt>
            <dd className="mt-1">
              <ActionFlowStatusBadge status={action.status} />
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <dt className="text-muted-foreground text-[11px]">最近同步</dt>
            <dd className="mt-0.5 text-sm font-medium">{action.lastSyncedAt}</dd>
          </div>
        </dl>
      </CaseSection>

      <CaseSection title="终端反馈">
        <p className="text-sm leading-relaxed">
          {action.terminalFeedback ?? "终端尚未回写反馈"}
        </p>
      </CaseSection>

      <CaseSection
        title="关联上下文"
        action={
          <div className="flex items-center gap-1">
            {action.workOrderKey ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                render={
                  <Link
                    href={workbenchPaneHref(action.workOrderKey, listContext)}
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
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              render={
                <Link
                  href={calendarHref(hk)}
                  scroll={false}
                />
              }
            >
              <Calendar className="size-3" aria-hidden />
              SLA 日历
            </Button>
          </div>
        }
      >
        <dl className="grid gap-2 sm:grid-cols-2">
          {action.contextFacts.map((fact) => (
            <div
              key={fact.label}
              className="rounded-lg border border-border bg-muted/20 px-3 py-2"
            >
              <dt className="text-muted-foreground text-[11px]">{fact.label}</dt>
              <dd className="mt-0.5 text-sm font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-muted-foreground mt-3 text-xs">
          商机编号：{action.opportunityId}
        </p>
      </CaseSection>

      <CaseSection title="同步记录">
        <ol className="relative space-y-4 border-l border-border pl-4">
          {action.timeline.map((item, index) => (
            <li key={`${item.at}-${index}`} className="relative">
              <span className="bg-primary absolute top-1.5 -left-[1.3rem] size-2 rounded-full" />
              <p className="text-muted-foreground text-[11px] tabular-nums">
                {item.at}
              </p>
              <p className="text-sm font-medium">{item.title}</p>
              {item.detail ? (
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {item.detail}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </CaseSection>
    </div>
  );
}

export function MyActionsDetailEmpty() {
  return (
    <div className="text-muted-foreground flex h-full min-h-[16rem] flex-col items-center justify-center px-6 text-center text-sm">
      <Check className="text-muted-foreground/50 mb-3 size-10" aria-hidden />
      <p>选择左侧 Action 查看分发与反馈状态</p>
      <p className="mt-1 text-xs">终端执行在 CRM / FSM / 企微等系统中完成</p>
    </div>
  );
}
