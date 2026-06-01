"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, X, Pencil, PhoneCall } from "lucide-react";
import type { Decision, SuggestionDoc } from "@/lib/suggestions";

const btnBase =
  "h-11 w-full gap-1.5 rounded-lg border bg-white text-sm font-medium shadow-none";

export function MobileDispositionActions({
  dedupeKey,
  workOrderId,
  suggestion,
  currentDecision,
}: {
  dedupeKey: string;
  workOrderId: string;
  suggestion: SuggestionDoc;
  currentDecision?: Decision | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<Decision | null>(null);

  async function submit(
    decision: Decision,
    extra?: { note?: string; modifiedSuggestion?: SuggestionDoc }
  ) {
    setBusy(decision);
    try {
      const res = await fetch("/api/outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dedupeKey, workOrderId, decision, ...extra }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "提交失败");
      }
      toast.success(
        decision === "approved"
          ? "已同意"
          : decision === "followed_up"
            ? "已标记跟进"
            : decision === "rejected"
              ? "已拒绝"
              : "已保存修改"
      );
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "提交失败");
    } finally {
      setBusy(null);
    }
  }

  const disabled = pending || busy !== null;

  return (
    <section className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">反馈</h2>
        {currentDecision ? (
          <span className="text-xs text-zinc-400">
            已反馈（可覆盖）
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => submit("approved")}
          className={`${btnBase} border-emerald-200 text-emerald-600 hover:bg-emerald-50`}
        >
          <Check className="h-4 w-4" />
          同意
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => submit("followed_up")}
          className={`${btnBase} border-zinc-200 text-zinc-600 hover:bg-zinc-50`}
        >
          <PhoneCall className="h-4 w-4" />
          已跟进
        </Button>
        <MobileModifyDialog
          suggestion={suggestion}
          disabled={disabled}
          onSave={(modified, note) =>
            submit("modified", { modifiedSuggestion: modified, note })
          }
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => submit("rejected")}
          className={`${btnBase} border-red-200 text-red-500 hover:bg-red-50`}
        >
          <X className="h-4 w-4" />
          拒绝
        </Button>
      </div>
    </section>
  );
}

function MobileModifyDialog({
  suggestion,
  disabled,
  onSave,
}: {
  suggestion: SuggestionDoc;
  disabled: boolean;
  onSave: (modified: SuggestionDoc, note: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [primary, setPrimary] = useState(suggestion.跟进方案?.主行动 ?? "");
  const [talk, setTalk] = useState(
    (suggestion.跟进方案?.沟通要点 ?? []).join("\n")
  );
  const [note, setNote] = useState("");

  function handleSave() {
    const modified: SuggestionDoc = {
      ...suggestion,
      跟进方案: {
        ...suggestion.跟进方案,
        主行动: primary.trim(),
        沟通要点: talk
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean),
      },
    };
    onSave(modified, note.trim());
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={`${btnBase} border-zinc-200 text-zinc-600 hover:bg-zinc-50`}
          />
        }
      >
        <Pencil className="h-4 w-4" />
        修改
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>修改跟进方案</DialogTitle>
          <DialogDescription>
            调整主行动与沟通要点后保存，记为「已修改」反馈。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="m-primary">主行动</Label>
            <Textarea
              id="m-primary"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="m-talk">沟通要点（每行一条）</Label>
            <Textarea
              id="m-talk"
              value={talk}
              onChange={(e) => setTalk(e.target.value)}
              rows={4}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="m-note">修改说明（可选）</Label>
            <Textarea
              id="m-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" size="sm" />}>
            取消
          </DialogClose>
          <Button size="sm" onClick={handleSave}>
            保存修改
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
