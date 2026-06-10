"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Calendar,
  Check,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CaseSection } from "@/components/case/case-section";
import { cn } from "@/lib/utils";
import {
  isDueToday,
  MY_ACTIONS_FEEDBACK_OPTIONS,
  type MyAction,
  type MyActionFeedbackOption,
} from "@/lib/my-actions-mock";
import {
  CalendarPriorityBadge,
  CalendarStatusBadge,
} from "@/components/workbench/calendar/calendar-badges";
import { workbenchPaneHref } from "@/lib/workbench-nav";

export function MyActionsDetail({
  action,
  hk,
  onStart,
}: {
  action: MyAction;
  hk?: string;
  onStart?: () => void;
}) {
  const [feedback, setFeedback] = useState<MyActionFeedbackOption>("contacted");
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState(action.checklist);
  const listContext = { hk, from: "active" as const };

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(action.scriptPreview);
      toast.success("话术已复制");
    } catch {
      toast.error("复制失败");
    }
  };

  return (
    <div className="space-y-4 p-4 lg:p-5">
      <header className="space-y-3">
        <h1 className="text-lg font-semibold leading-snug">{action.title}</h1>
        <div className="flex flex-wrap gap-1.5">
          <CalendarPriorityBadge priority={action.priority} />
          <CalendarStatusBadge status={action.status} />
          {isDueToday(action) ? (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-amber-800"
            >
              今日到期
            </Badge>
          ) : null}
          {action.status === "overdue" ? (
            <Badge variant="destructive">逾期</Badge>
          ) : null}
          <Badge variant="secondary">来自 {action.sourceAgent}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              onStart?.();
              toast.success("已开始执行");
            }}
          >
            <Play className="size-3.5" aria-hidden />
            开始执行
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => toast.success("已标记完成（演示）")}
          >
            标记完成
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => toast.message("延期功能即将开放")}
          >
            延期
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => toast.message("转派功能即将开放")}
          >
            转派
          </Button>
          <Button type="button" size="icon-sm" variant="outline" aria-label="更多">
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        </div>
      </header>

      <CaseSection title="行动目标">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {action.goal}
        </p>
      </CaseSection>

      <CaseSection
        title="执行建议 / Next Best Action"
        action={
          action.scriptPreview ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-primary h-7 gap-1 text-xs"
              onClick={copyScript}
            >
              <Copy className="size-3" aria-hidden />
              查看话术（可复制）
            </Button>
          ) : null
        }
      >
        <ul className="text-muted-foreground list-disc space-y-1.5 pl-4 text-sm">
          {action.suggestions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {action.scriptPreview ? (
          <p className="bg-muted/50 text-muted-foreground mt-3 rounded-lg border border-border p-3 text-xs leading-relaxed">
            {action.scriptPreview}
          </p>
        ) : null}
      </CaseSection>

      <CaseSection title="执行清单">
        <ul className="space-y-2">
          {checklist.map((item) => (
            <li key={item.id}>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleCheck(item.id)}
                  className="mt-0.5 size-4 rounded border-border"
                />
                <span
                  className={cn(
                    item.done && "text-muted-foreground line-through"
                  )}
                >
                  {item.label}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </CaseSection>

      <CaseSection title="反馈更新">
        <div className="space-y-3">
          <fieldset>
            <legend className="text-muted-foreground mb-2 text-xs font-medium">
              联系结果
            </legend>
            <div className="flex flex-wrap gap-2">
              {MY_ACTIONS_FEEDBACK_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    feedback === opt.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <input
                    type="radio"
                    name="feedback"
                    value={opt.id}
                    checked={feedback === opt.id}
                    onChange={() => setFeedback(opt.id)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="action-notes" className="text-xs">
              补充说明（必填）
            </Label>
            <Textarea
              id="action-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="记录本次沟通要点、客户态度与下一步安排…"
              className="min-h-20 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="next-follow-up" className="text-xs">
              下次跟进时间
            </Label>
            <input
              id="next-follow-up"
              type="datetime-local"
              className="border-input bg-background h-8 w-full max-w-xs rounded-lg border px-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (!notes.trim()) {
                toast.error("请填写补充说明");
                return;
              }
              toast.success("反馈已保存（演示）");
            }}
          >
            保存更新
          </Button>
        </div>
      </CaseSection>

      <CaseSection
        title="上下文 / 关键事实"
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
                查看关联工单
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
                  href={hk ? `/?tab=calendar&hk=${hk}` : "/?tab=calendar"}
                  scroll={false}
                />
              }
            >
              <Calendar className="size-3" aria-hidden />
              日历
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
          关联对象：{action.target.name}（{action.target.type}）
        </p>
      </CaseSection>

      <CaseSection title="行动记录">
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
      <p>选择左侧行动查看详情</p>
      <p className="mt-1 text-xs">可在此执行、反馈并查看 Agent 建议</p>
    </div>
  );
}
