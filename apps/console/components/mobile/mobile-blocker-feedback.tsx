"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BLOCKER_CHOICES, blockerDisplay } from "@/lib/blockers";
import type { BlockerType } from "@/lib/blockers";

export function MobileBlockerFeedback({
  dedupeKey,
  workOrderId,
  currentType,
  currentNote,
}: {
  dedupeKey: string;
  workOrderId: string;
  currentType?: BlockerType | null;
  currentNote?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [choice, setChoice] = useState<string>("");
  const [note, setNote] = useState(currentNote ?? "");

  async function submit(selectedChoice: string) {
    try {
      const res = await fetch("/api/blockers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dedupeKey,
          workOrderId,
          choice: selectedChoice,
          note: note.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "提交失败");
      }
      toast.success("阻塞信息已保存");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "提交失败");
    }
  }

  return (
    <section className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-zinc-900">阻塞</h2>
      <div className="mb-3">
        <p className="text-sm font-medium text-zinc-800">阻塞信息</p>
        <p className="text-sm text-zinc-500">
          当前：{blockerDisplay(currentType, currentNote)}
        </p>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2">
        {BLOCKER_CHOICES.map((c) => (
          <Button
            key={c.choice}
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              setChoice(c.choice);
              void submit(c.choice);
            }}
            className={`h-10 rounded-lg border bg-white text-sm font-normal shadow-none ${
              choice === c.choice
                ? "border-blue-400 bg-blue-50 text-blue-700"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {c.label}
          </Button>
        ))}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="m-blocker-note" className="text-sm text-zinc-600">
          一句话（可选）
        </Label>
        <div className="relative">
          <Textarea
            id="m-blocker-note"
            rows={3}
            maxLength={100}
            placeholder="例如：客户说报价偏高，想再对比一下"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={pending}
            className="resize-none border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400"
          />
          <span className="pointer-events-none absolute right-2 bottom-2 text-xs text-zinc-400">
            {note.length}/100
          </span>
        </div>
      </div>
    </section>
  );
}
