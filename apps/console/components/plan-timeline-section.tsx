"use client";

import { useState } from "react";
import { Database, Sparkles } from "lucide-react";
import type { SurveyPayload, TimelineEvent } from "@/lib/timeline";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatAt(at: string, atMs: number): string {
  if (atMs > 0) {
    return new Date(atMs).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return at || "—";
}

function SurveyDetailBody({ p }: { p: SurveyPayload }) {
  const rows: { label: string; value: string }[] = [
    { label: "勘察单号", value: p.surveyNum },
    { label: "勘察部位", value: p.partLabel },
    { label: "勘察时间", value: p.surveyTime },
    { label: "地址", value: p.address },
    { label: "负责人", value: p.supervisorName },
    { label: "平面面积", value: p.planeArea },
    { label: "施工面积", value: p.squareMeter },
    { label: "渗漏原因", value: p.leakageCause },
    { label: "备注", value: p.memo },
    { label: "创建时间", value: p.createTime },
    { label: "更新时间", value: p.updateTime },
  ];
  return (
    <dl className="grid gap-2 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[88px_1fr] gap-2">
          <dt className="text-muted-foreground">{r.label}</dt>
          <dd className="leading-relaxed">{r.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function TimelineRow({
  ev,
  onSurvey,
}: {
  ev: TimelineEvent;
  onSurvey: (p: SurveyPayload) => void;
}) {
  const Icon = ev.lane === "business" ? Database : Sparkles;
  const canSurvey = ev.kind === "survey" && ev.payload;

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      <span
        className="bg-border absolute top-7 left-3.5 h-[calc(100%-8px)] w-px last:hidden"
        aria-hidden
      />
      <span
        className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          ev.lane === "business"
            ? "bg-blue-500/10 text-blue-600"
            : "bg-violet-500/10 text-violet-600"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium">{ev.title}</span>
          <span className="text-muted-foreground font-mono text-[11px]">
            {formatAt(ev.at, ev.atMs)}
          </span>
        </div>
        {ev.summary ? (
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
            {ev.summary}
          </p>
        ) : null}
        {canSurvey ? (
          <Button
            type="button"
            variant="link"
            className="h-auto px-0 py-0 text-xs"
            onClick={() => onSurvey(ev.payload as SurveyPayload)}
          >
            查看勘察单
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function PlanTimelineSection({ events }: { events: TimelineEvent[] }) {
  const [survey, setSurvey] = useState<SurveyPayload | null>(null);

  return (
    <>
      <p className="text-muted-foreground mb-4 text-xs">
        业务事实与 Agent 工作记录；数据在引擎跑单后更新。
      </p>

      {events.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          暂无记录。待 AOL 引擎处理该工单后会生成时间轴。
        </p>
      ) : (
        <ol className="relative">
          {events.map((ev) => (
            <TimelineRow key={ev.id} ev={ev} onSurvey={setSurvey} />
          ))}
        </ol>
      )}

      <Dialog open={survey != null} onOpenChange={(v) => !v && setSurvey(null)}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>勘察单</DialogTitle>
          </DialogHeader>
          {survey ? <SurveyDetailBody p={survey} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
