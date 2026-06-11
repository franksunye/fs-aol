"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ActionCompleteForm({
  actionId,
  disabled,
}: {
  actionId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const text = feedback.trim();
    if (!text) {
      toast.error("请填写执行反馈");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/actions/${actionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terminalFeedback: text }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error || "提交失败");
      }
      toast.success("已标记执行完成");
      setFeedback("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "提交失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-sm font-medium">标记执行完成</p>
      <textarea
        className="border-input bg-background min-h-[72px] w-full rounded-md border px-3 py-2 text-sm"
        placeholder="简述跟进结果（必填）"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        disabled={disabled || loading}
      />
      <Button
        type="button"
        size="sm"
        disabled={disabled || loading}
        onClick={() => void submit()}
      >
        {loading ? "提交中…" : "提交反馈并闭环"}
      </Button>
    </div>
  );
}
