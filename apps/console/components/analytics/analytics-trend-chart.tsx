import { Card } from "@/components/ui/card";
import type { AnalyticsTrendPoint } from "@/lib/analytics";

export function AnalyticsTrendChart({
  points,
}: {
  points: AnalyticsTrendPoint[];
}) {
  const width = 560;
  const height = 220;
  const pad = { top: 16, right: 12, bottom: 28, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const maxVal = Math.max(10, ...points.map((p) => p.discovered), 1);
  const yMax = Math.ceil(maxVal / 10) * 10;
  const yTicks = 5;
  const yStep = yMax / yTicks;

  const coords = points.map((p, i) => {
    const x =
      pad.left +
      (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = pad.top + innerH - (p.discovered / yMax) * innerH;
    return { x, y, ...p };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(pad.top + innerH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(pad.top + innerH).toFixed(1)} Z`
      : "";

  return (
    <Card className="rounded-xl border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold">Agent 推动趋势</h2>
      {points.length === 0 ? (
        <p className="text-muted-foreground text-sm">所选时段暂无 Agent 分析记录</p>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full max-h-[240px]"
          role="img"
          aria-label="Agent 发现机会日趋势折线图"
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
          {areaPath ? (
            <path d={areaPath} fill="oklch(0.541 0.281 293.009 / 0.12)" />
          ) : null}
          {linePath ? (
            <path
              d={linePath}
              fill="none"
              stroke="oklch(0.541 0.281 293.009)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          ) : null}
          {coords.map((c) => (
            <g key={c.date}>
              <circle
                cx={c.x}
                cy={c.y}
                r="4"
                fill="oklch(0.541 0.281 293.009)"
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={c.x}
                y={height - 8}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {c.label}
              </text>
            </g>
          ))}
        </svg>
      )}
      <p className="text-muted-foreground mt-2 text-xs">
        按日统计 Agent 新进池机会（需跟进建议，按 processed_at）
      </p>
    </Card>
  );
}
