import { Card } from "@/components/ui/card";
import type { AnalyticsPrioritySlice } from "@/lib/analytics";

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

export function AnalyticsPriorityChart({
  slices,
  total,
}: {
  slices: AnalyticsPrioritySlice[];
  total: number;
}) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 72;
  const stroke = 28;

  let cursor = 0;
  const arcs = slices.map((slice) => {
    const sweep = total ? (slice.count / total) * 360 : 0;
    const start = cursor;
    const end = cursor + sweep;
    cursor = end;
    return { slice, start, end, sweep };
  });

  return (
    <Card className="rounded-xl border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold">机会分布</h2>
      {total === 0 ? (
        <p className="text-muted-foreground text-sm">所选时段暂无机会数据</p>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              role="img"
              aria-label="机会优先级分布环形图"
            >
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="var(--muted)"
                strokeWidth={stroke}
              />
              {arcs.map(({ slice, start, end, sweep }) => {
                if (sweep <= 0) return null;
                if (sweep >= 359.9) {
                  return (
                    <circle
                      key={slice.key}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={stroke}
                    />
                  );
                }
                return (
                  <path
                    key={slice.key}
                    d={describeArc(cx, cy, r, start, end)}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={stroke}
                    strokeLinecap="butt"
                  />
                );
              })}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold tabular-nums">{total}</span>
              <span className="text-muted-foreground text-xs">总数</span>
            </div>
          </div>
          <ul className="min-w-0 flex-1 space-y-2 text-sm">
            {slices.map((slice) => (
              <li key={slice.key} className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">{slice.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {slice.count}{" "}
                  <span className="text-foreground">({slice.percent}%)</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-muted-foreground mt-4 text-xs">
        按所选时段内 Agent 新进池机会的优先级分布
      </p>
    </Card>
  );
}
