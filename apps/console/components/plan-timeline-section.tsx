"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Sparkles } from "lucide-react";
import type {
  AppointmentPayload,
  QuoteDetailItem,
  QuoteLinePayload,
  QuotePackageDetail,
  QuotePayload,
  SurveyPayload,
  TimelineEvent,
  TimelineFormField,
} from "@/lib/timeline";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

function isDash(v: string): boolean {
  return !v || v === "—";
}

function QuoteItemsTable({ items }: { items: QuoteDetailItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">暂无项目明细行</p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[52px]">类型</TableHead>
          <TableHead>名称</TableHead>
          <TableHead className="w-[72px]">规格</TableHead>
          <TableHead className="w-[48px] text-right">数量</TableHead>
          <TableHead className="w-[40px]">单位</TableHead>
          <TableHead className="w-[56px] text-right">单价</TableHead>
          <TableHead className="w-[56px] text-right">金额</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((it, idx) => (
          <TableRow key={`${it.category}-${it.name}-${idx}`}>
            <TableCell className="text-muted-foreground text-xs">
              {it.category}
            </TableCell>
            <TableCell>
              <div className="font-medium">{it.name}</div>
              {!isDash(it.note) ? (
                <div className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
                  {it.note}
                </div>
              ) : null}
            </TableCell>
            <TableCell className="text-xs">{it.spec}</TableCell>
            <TableCell className="text-right text-xs">{it.quantity}</TableCell>
            <TableCell className="text-xs">{it.unit}</TableCell>
            <TableCell className="text-right text-xs">{it.unitPrice}</TableCell>
            <TableCell className="text-right text-xs">{it.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function QuotePackageBlock({ pkg }: { pkg: QuotePackageDetail }) {
  const meta = [
    !isDash(pkg.skuCode) ? `编码 ${pkg.skuCode}` : "",
    !isDash(pkg.quantity) ? `数量 ${pkg.quantity}` : "",
    !isDash(pkg.unit) ? pkg.unit : "",
    !isDash(pkg.packageAmount) ? `小计 ${pkg.packageAmount} 元` : "",
  ].filter(Boolean);
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium">{pkg.name}</p>
        {meta.length > 0 ? (
          <p className="text-muted-foreground text-xs">{meta.join(" · ")}</p>
        ) : null}
      </div>
      <QuoteItemsTable items={pkg.items} />
    </div>
  );
}

function QuoteLineBlock({ line, index }: { line: QuoteLinePayload; index: number }) {
  const title =
    line.packageNames !== "—" ? line.packageNames : `方案行 ${index + 1}`;
  const summary = [
    line.repairParts !== "—" ? `维修部位：${line.repairParts}` : "",
    line.constructionLocation !== "—"
      ? `施工位置：${line.constructionLocation}`
      : "",
    line.constructionSite !== "—" && line.constructionSite !== line.constructionLocation
      ? `施工部位：${line.constructionSite}`
      : "",
    line.warrantyLabel !== "—" ? `质保：${line.warrantyLabel}` : "",
    line.maintainArea !== "—" ? `面积：${line.maintainArea}` : "",
    line.amountYuan !== "—" ? `行金额 ${line.amountYuan} 元` : "",
  ].filter(Boolean);

  const packages = line.packages ?? [];
  const lineItems = line.lineItems ?? [];
  const hasPackages = packages.some((p) => (p.items ?? []).length > 0);
  const hasLineItems = lineItems.length > 0;

  return (
    <li className="bg-muted/40 space-y-3 rounded-md border p-3">
      <div>
        <p className="font-medium text-sm">{title}</p>
        {summary.length > 0 ? (
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {summary.join(" · ")}
          </p>
        ) : null}
        {line.partDescription !== "—" ? (
          <p className="mt-1 text-xs leading-relaxed">{line.partDescription}</p>
        ) : null}
      </div>
      {hasPackages ? (
        <div className="space-y-4">
          <p className="text-muted-foreground text-xs font-medium">项目明细（套餐）</p>
          {packages.map((pkg, pi) => (
            <QuotePackageBlock key={`${pkg.name}-${pi}`} pkg={pkg} />
          ))}
        </div>
      ) : null}
      {hasLineItems ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">
            项目明细（行级材料/工序/措施）
          </p>
          <QuoteItemsTable items={lineItems} />
        </div>
      ) : null}
      {!hasPackages && !hasLineItems ? (
        <p className="text-muted-foreground text-xs">暂无项目明细表数据</p>
      ) : null}
    </li>
  );
}

function QuoteDetailBody({ p }: { p: QuotePayload }) {
  return (
    <div className="space-y-4">
      <FormDetail fields={p.fields} />
      {p.lines.length > 0 ? (
        <div>
          <p className="text-muted-foreground mb-2 text-xs">报价方案与项目明细</p>
          <ul className="space-y-3">
            {p.lines.map((line, i) => (
              <QuoteLineBlock key={i} line={line} index={i} />
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
  agentRoundHref,
  unifiedFeed = false,
}: {
  ev: TimelineEvent;
  onOpen: (m: DetailModal) => void;
  agentRoundHref?: string;
  unifiedFeed?: boolean;
}) {
  const isAgent = ev.lane === "agent";
  const Icon = ev.lane === "business" ? Database : Sparkles;
  const agentHighlight =
    isAgent &&
    ["reanalysis", "reanalyze_pending", "inbox", "stale_snapshot"].includes(
      ev.kind
    );
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
    <li
      className={`relative flex gap-3 pb-5 last:pb-0 ${
        unifiedFeed && isAgent
          ? "border-l-4 border-l-primary pl-3"
          : unifiedFeed
            ? "border-l-4 border-l-border pl-3"
            : ""
      }`}
    >
      <span
        className="bg-border absolute top-7 left-3.5 h-[calc(100%-8px)] w-px last:hidden"
        aria-hidden
      />
      <span
        className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          ev.lane === "business"
            ? "bg-muted text-muted-foreground"
            : agentHighlight
              ? "bg-amber-500/15 text-amber-700"
              : "bg-agent-surface text-primary"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={`text-sm font-medium ${agentHighlight ? "text-amber-900 dark:text-amber-100" : ""}`}
          >
            {ev.title}
          </span>
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
        {agentRoundHref ? (
          <Link
            href={agentRoundHref}
            className="text-primary mt-1 inline-block text-xs hover:underline"
          >
            查看此次 Agent 分析 →
          </Link>
        ) : null}
      </div>
    </li>
  );
}

/** 业务 + Agent 事件按 at_ms 合并排序的 Activity Feed */
export function PlanTimelineSection({
  events,
  roundLinks,
  suggestionBaseHref,
  compact = false,
  unifiedFeed = true,
}: {
  events: TimelineEvent[];
  /** event id → 1-based trace round */
  roundLinks?: Record<number, number>;
  /** e.g. /suggestions/KEY — 用于跳转对应 Run 轮次 */
  suggestionBaseHref?: string;
  compact?: boolean;
  /** 统一 Feed 样式：Agent 紫左边框、业务中性 */
  unifiedFeed?: boolean;
}) {
  const [modal, setModal] = useState<DetailModal>(null);
  const sortedEvents = [...events].sort((a, b) => b.atMs - a.atMs);

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
      {!compact ? (
        <p className="text-muted-foreground mb-4 text-xs">
          Activity Feed：业务里程碑与 Agent 工作记录合并展示（含多次分析、归档、管家反馈）。
        </p>
      ) : null}

      {sortedEvents.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          暂无时间轴。请确认引擎已处理该工单，或在运维侧执行 inbox /
          timeline 同步。
        </p>
      ) : (
        <ol className="relative">
          {sortedEvents.map((ev) => {
            const round = roundLinks?.[ev.id] ?? ev.traceRound ?? undefined;
            const agentRoundHref =
              round != null && suggestionBaseHref
                ? `${suggestionBaseHref}${suggestionBaseHref.includes("?") ? "&" : "?"}round=${round}`
                : undefined;
            return (
              <TimelineRow
                key={ev.id}
                ev={ev}
                onOpen={setModal}
                agentRoundHref={agentRoundHref}
                unifiedFeed={unifiedFeed}
              />
            );
          })}
        </ol>
      )}

      <Dialog open={modal != null} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto sm:max-w-2xl">
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
