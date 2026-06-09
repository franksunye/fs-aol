"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  BLOCKER_CHOICES,
  blockerDisplay,
  blockerTypeToChoice,
} from "@/lib/blockers";
import type { BlockerType } from "@/lib/blockers";
import { cn } from "@/lib/utils";

const selectClass =
  "border-input bg-background text-foreground h-9 w-full min-w-0 rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const inputClass =
  "border-input bg-background text-foreground placeholder:text-muted-foreground h-9 w-full min-w-0 flex-1 rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function BlockerFeedbackForm({
  dedupeKey,
  workOrderId,
  currentType,
  currentNote,
  compact = false,
}: {
  dedupeKey: string;
  workOrderId: string;
  currentType?: BlockerType | null;
  currentNote?: string | null;
  /** 详情页：下拉 + 单行输入 + 提交，固定高度 */
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [choice, setChoice] = useState(() => blockerTypeToChoice(currentType));
  const [note, setNote] = useState(currentNote ?? "");

  useEffect(() => {
    setChoice(blockerTypeToChoice(currentType));
    setNote(currentNote ?? "");
  }, [currentType, currentNote]);

  async function submit() {
    if (!choice) {
      toast.error("请先选择卡点类型");
      return;
    }
    try {
      const res = await fetch("/api/blockers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dedupeKey,
          workOrderId,
          choice,
          note: note.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "提交失败");
      }
      toast.success("卡点已保存");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "提交失败");
    }
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">
          当前：{blockerDisplay(currentType, currentNote)}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="w-full sm:w-[148px] shrink-0">
            <label
              htmlFor="blocker-choice"
              className="text-muted-foreground mb-1 block text-xs font-medium"
            >
              卡点
            </label>
            <select
              id="blocker-choice"
              className={selectClass}
              value={choice}
              disabled={pending}
              onChange={(e) => setChoice(e.target.value)}
            >
              <option value="">请选择</option>
              {BLOCKER_CHOICES.map((c) => (
                <option key={c.choice} value={c.choice}>
                  {c.label.replace(/^A |^B |^C |^D /, "")}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <label
              htmlFor="blocker-note-compact"
              className="text-muted-foreground mb-1 block text-xs font-medium"
            >
              一句话反馈
            </label>
            <div className="flex gap-2">
              <input
                id="blocker-note-compact"
                type="text"
                className={inputClass}
                placeholder="请填写（可选）"
                value={note}
                disabled={pending}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submit();
                }}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-9 shrink-0"
                disabled={pending || !choice}
                aria-label="保存卡点"
                onClick={() => void submit()}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-medium">卡点（可选）</div>
        <p className="text-muted-foreground text-xs">
          当前：{blockerDisplay(currentType, currentNote)}
        </p>
      </div>
      <select
        className={cn(selectClass, "max-w-xs")}
        value={choice}
        disabled={pending}
        onChange={(e) => setChoice(e.target.value)}
      >
        <option value="">请选择</option>
        {BLOCKER_CHOICES.map((c) => (
          <option key={c.choice} value={c.choice}>
            {c.label}
          </option>
        ))}
      </select>
      <div className="flex max-w-lg gap-2">
        <input
          type="text"
          className={inputClass}
          placeholder="例如：客户说报价偏高，想再对比一下"
          value={note}
          disabled={pending}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button
          type="button"
          size="sm"
          disabled={pending || !choice}
          onClick={() => void submit()}
        >
          保存
        </Button>
      </div>
    </div>
  );
}
