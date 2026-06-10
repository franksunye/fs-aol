"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  evaluationActionsHref,
  evaluationWorkbenchActiveHref,
} from "@/lib/evaluation-mock";
import type {
  EvaluationActionStatusSeries,
  EvaluationTrendPoint,
} from "@/lib/evaluation-mock";

const SUGGESTION_COLOR = "oklch(0.541 0.281 293.009)";

function SuggestionTrendChart({
  points,
  hk,
}: {
  points: EvaluationTrendPoint[];
  hk?: string;
}) {
  const width = 560;
  const height = 240;
  const pad = { top: 20, right: 16, bottom: 32, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxVal = Math.max(10, ...points.map((p) => p.value), 1);
  const yMax = Math.ceil(maxVal / 5) * 5;
  const yTicks = 5;
  const yStep = yMax / yTicks;

  const coords = points.map((p, i) => {
    const x =
      pad.left +
      (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = pad.top + innerH - (p.value / yMax) * innerH;
    return { x, y, ...p };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  return (
    <Card className="rounded-xl border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold">建议数量趋势</h2>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full max-h-[260px]"
        role="img"
        aria-label="建议数量近 7 天趋势折线图"
      >
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = yMax - i * yStep;
          const y = pad.top + (i / yTicks) * innerH;
          return (
            <g key={val}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />
              <text
                x={pad.left - 6}
                y={y + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
              >
                {Math.round(val)}
              </text>
            </g>
          );
        })}
        <path
          d={linePath}
          fill="none"
          stroke={SUGGESTION_COLOR}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {coords.map((c) => (
          <circle
            key={c.label}
            cx={c.x}
            cy={c.y}
            r="3.5"
            fill={SUGGESTION_COLOR}
            stroke="white"
            strokeWidth="2"
          />
        ))}
        {coords.map((c) => (
          <text
            key={`l-${c.label}`}
            x={c.x}
            y={height - 10}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {c.label}
          </text>
        ))}
      </svg>
      <p className="text-muted-foreground mt-2 text-xs">
        <Link href={evaluationWorkbenchActiveHref(hk)} className="hover:text-primary">
          查看待审核建议 →
        </Link>
      </p>
    </Card>
  );
}

function ActionStatusTrendChart({
  labels,
  series,
  hk,
}: {
  labels: string[];
  series: EvaluationActionStatusSeries[];
  hk?: string;
}) {
  const width = 560;
  const height = 240;
  const pad = { top: 20, right: 16, bottom: 32, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxVal = Math.max(
    10,
    ...series.flatMap((s) => s.values),
    1
  );
  const yMax = Math.ceil(maxVal / 5) * 5;
  const yTicks = 5;
  const yStep = yMax / yTicks;

  const linePath = (values: number[]) =>
    values
      .map((v, i) => {
        const x =
          pad.left +
          (labels.length <= 1 ? innerW / 2 : (i / (labels.length - 1)) * innerW);
        const y = pad.top + innerH - (v / yMax) * innerH;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <Card className="rounded-xl border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Action 状态趋势</h2>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: s.color }}
                aria-hidden
              />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full max-h-[260px]"
        role="img"
        aria-label="Action 状态多折线趋势图"
      >
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = yMax - i * yStep;
          const y = pad.top + (i / yTicks) * innerH;
          return (
            <g key={val}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />
              <text
                x={pad.left - 6}
                y={y + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
              >
                {Math.round(val)}
              </text>
            </g>
          );
        })}
        {series.map((s) => (
          <path
            key={s.key}
            d={linePath(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ))}
        {labels.map((label, i) => {
          const x =
            pad.left +
            (labels.length <= 1 ? innerW / 2 : (i / (labels.length - 1)) * innerW);
          return (
            <text
              key={label}
              x={x}
              y={height - 10}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {label}
            </text>
          );
        })}
      </svg>
      <p className="text-muted-foreground mt-2 text-xs">
        <Link href={evaluationActionsHref(hk)} className="hover:text-primary">
          查看 Action 流转 →
        </Link>
      </p>
    </Card>
  );
}

export function EvaluationCharts({
  suggestionTrend,
  actionStatusTrend,
  hk,
}: {
  suggestionTrend: EvaluationTrendPoint[];
  actionStatusTrend: {
    labels: string[];
    series: EvaluationActionStatusSeries[];
  };
  hk?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <SuggestionTrendChart points={suggestionTrend} hk={hk} />
      <ActionStatusTrendChart
        labels={actionStatusTrend.labels}
        series={actionStatusTrend.series}
        hk={hk}
      />
    </div>
  );
}
