"use client";

import { useState } from "react";
import { Database, Sparkles } from "lucide-react";
import type {
  AppointmentPayload,
  QuotePayload,
  SurveyPayload,
  TimelineEvent,
  TimelineFormField,
} from "@/lib/timeline";
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

function FormDetail({ fields }: { fields: TimelineFormField[] }) {
  if (fields.length === 0) {
    return <p className="text-muted-foreground text-sm">暂无表单数据</p>;
  }
  return (
    <dl className="grid gap-2 text-sm">
      {fields.map((r) => (
        <div key={r.label} className="grid grid-cols-[96px_1fr] gap-2">
          <dt className="text-muted-foreground shrink-0">{r.label}</dt>
          <dd className="leading-relaxed break-words">{r.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function SurveyDetailBody({ p }: { p: SurveyPayload }) {
  return (
    <div className="space-y-4">
      <FormDetail fields={p.fields} />
      {p.images.length > 0 ? (
        <div>
          <p className="text-muted-foreground mb-2 text-xs">
            现场照片（{p.images.length}）
          </p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {p.images.map((img) => (
              <li key={img.url}>
                <a
                  href={img.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-md border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name || "现场照片"}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function QuoteDetailBody({ p }: { p: QuotePayload }) {
  return (
    <div className="space-y-4">
      <FormDetail fields={p.fields} />
      {p.lines.length > 0 ? (
        <div>
          <p className="text-muted-foreground mb-2 text-xs">报价明细行</p>
          <ul className="space-y-3 text-sm">
            {p.lines.map((line, i) => (
              <li
                key={i}
                className="bg-muted/40 space-y-1 rounded-md border p-3"
              >
                <p className="font-medium">
                  {line.packageNames !== "—"
                    ? line.packageNames
                    : `明细 ${i + 1}`}
                  {line.amountYuan !== "—" ? ` · ${line.amountYuan} 元` : ""}
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {[
                    line.repairParts !== "—" ? `部位：${line.repairParts}` : "",
                    line.constructionLocation !== "—"
                      ? `位置：${line.constructionLocation}`
                      : "",
                    line.warrantyLabel !== "—"
                      ? `质保：${line.warrantyLabel}`
                      : "",
                    line.maintainArea !== "—"
                      ? `面积：${line.maintainArea}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {line.partDescription !== "—" ? (
                  <p className="text-xs leading-relaxed">{line.partDescription}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

type DetailModal =
  | { type: "survey"; data: SurveyPayload }
  | { type: "appointment"; data: AppointmentPayload }
  | { type: "quote"; data: QuotePayload }
  | null;

function TimelineRow({
  ev,
  onOpen,
}: {
  ev: TimelineEvent;
  onOpen: (m: DetailModal) => void;
}) {
  const Icon = ev.lane === "business" ? Database : Sparkles;
  const detailLink =
    ev.kind === "survey" && ev.survey
      ? { label: "查看勘察表单", modal: { type: "survey" as const, data: ev.survey } }
      : ev.kind === "appointment" && ev.appointment
        ? {
            label: "查看预约表单",
            modal: { type: "appointment" as const, data: ev.appointment },
          }
        : ev.kind === "quote" && ev.quote
          ? { label: "查看报价表单", modal: { type: "quote" as const, data: ev.quote } }
          : null;

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
        {detailLink ? (
          <Button
            type="button"
            variant="link"
            className="h-auto px-0 py-0 text-xs"
            onClick={() => onOpen(detailLink.modal)}
          >
            {detailLink.label}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function PlanTimelineSection({ events }: { events: TimelineEvent[] }) {
  const [modal, setModal] = useState<DetailModal>(null);

  const title =
    modal?.type === "survey"
      ? "勘察表单"
      : modal?.type === "appointment"
        ? "预约表单"
        : modal?.type === "quote"
          ? "报价表单"
          : "";

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
            <TimelineRow key={ev.id} ev={ev} onOpen={setModal} />
          ))}
        </ol>
      )}

      <Dialog open={modal != null} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {modal?.type === "survey" ? (
            <SurveyDetailBody p={modal.data} />
          ) : null}
          {modal?.type === "appointment" ? (
            <FormDetail fields={modal.data.fields} />
          ) : null}
          {modal?.type === "quote" ? <QuoteDetailBody p={modal.data} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
