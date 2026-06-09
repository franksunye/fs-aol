import { Badge } from "@/components/ui/badge";
import {
  diffSuggestions,
  hasSuggestionChanges,
  type FieldDiff,
} from "@/lib/suggestion-diff";
import type { SuggestionDoc } from "@/lib/suggestions";

function DiffRow({ d }: { d: FieldDiff }) {
  if (!d.changed) {
    return (
      <div className="text-muted-foreground text-xs">
        <span className="font-medium text-foreground/80">{d.field}</span>
        <span className="ml-2">{d.cur || d.prev || "—"}</span>
        <span className="ml-1">（未变）</span>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs">
      <div className="font-medium text-amber-900 dark:text-amber-100">
        {d.field} · 有变化
      </div>
      <div className="text-muted-foreground mt-1 line-through">{d.prev || "—"}</div>
      <div className="mt-0.5 font-medium text-foreground">{d.cur || "—"}</div>
    </div>
  );
}

export function AnalysisDiffCard({
  prev,
  cur,
  round,
  compact = false,
}: {
  prev: SuggestionDoc;
  cur: SuggestionDoc;
  round: number;
  compact?: boolean;
}) {
  const diffs = diffSuggestions(prev, cur);
  const anyChange = hasSuggestionChanges(diffs);

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {!compact ? (
          <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            与第 {round - 1} 次对比
          </h3>
        ) : (
          <span className="text-muted-foreground text-xs">
            首次分析 → 第 {round} 次
          </span>
        )}
        <Badge
          variant={anyChange ? "default" : "secondary"}
          className="text-[10px] font-normal"
        >
          {anyChange ? "有更新" : "无实质变化"}
        </Badge>
      </div>
      <div className="space-y-2">
        {diffs.map((d) => (
          <DiffRow key={d.field} d={d} />
        ))}
      </div>
    </section>
  );
}
