import Link from "next/link";
import { Card } from "@/components/ui/card";
import { overviewActionsHref } from "@/lib/overview-nav";
import type { OverviewTrendPoint } from "@/lib/overview-mock";
import { DataStateBadge } from "@/components/data-state-badge";

const SUGGESTION_COLOR = "oklch(0.541 0.281 293.009)";
const ACTION_COLOR = "oklch(0.623 0.214 259.815)";

export function OverviewTrendChart({
  points,
  hk,
}: {
  points: OverviewTrendPoint[];
  hk?: string;
}) {
  const width = 560;
  const height = 240;
  const pad = { top: 20, right: 16, bottom: 32, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxVal = Math.max(10, ...points.flatMap((p) => [p.suggestions, p.actions]), 1);
  const yMax = Math.ceil(maxVal / 5) * 5;
  const yTicks = 5;
  const yStep = yMax / yTicks;

  const suggestionCoords = points.map((p, i) => {
    const x = pad.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = pad.top + innerH - (p.suggestions / yMax) * innerH;
    return { x, y, ...p };
  });

  const actionCoords = points.map((p, i) => {
    const x = pad.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = pad.top + innerH - (p.actions / yMax) * innerH;
    return { x, y };
  });

  const linePath = (coords: { x: number; y: number }[]) =>
    coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");

  return (
    <Card className="rounded-xl border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold">建议数 vs Actions（近 7 天趋势）</h2>
          <DataStateBadge state="scenario" />
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: SUGGESTION_COLOR }} aria-hidden />
            建议数
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: ACTION_COLOR }} aria-hidden />
            Actions 数
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full max-h-[260px]" role="img" aria-label="建议数与 Actions 近 7 天趋势折线图">
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = yMax - i * yStep;
          const y = pad.top + (i / yTicks) * innerH;
          return (
            <g key={val}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="var(--border)" strokeDasharray="4 4" />
              <text x={pad.left - 6} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">
                {Math.round(val)}
              </text>
            </g>
          );
        })}
        <path d={linePath(suggestionCoords)} fill="none" stroke={SUGGESTION_COLOR} strokeWidth="2.5" strokeLinejoin="round" />
        <path d={linePath(actionCoords)} fill="none" stroke={ACTION_COLOR} strokeWidth="2.5" strokeLinejoin="round" />
        {suggestionCoords.map((c) => (
          <circle key={`s-${c.date}`} cx={c.x} cy={c.y} r="3.5" fill={SUGGESTION_COLOR} stroke="white" strokeWidth="2" />
        ))}
        {actionCoords.map((c, i) => (
          <circle key={`a-${i}`} cx={c.x} cy={c.y} r="3.5" fill={ACTION_COLOR} stroke="white" strokeWidth="2" />
        ))}
        {suggestionCoords.map((c) => (
          <text key={`l-${c.date}`} x={c.x} y={height - 10} textAnchor="middle" className="fill-muted-foreground text-[10px]">
            {c.label}
          </text>
        ))}
      </svg>
      <p className="text-muted-foreground mt-3 text-xs">
        <Link href={overviewActionsHref(hk)} scroll={false} className="text-primary hover:underline">
          查看 Action 流转 →
        </Link>
      </p>
    </Card>
  );
}
