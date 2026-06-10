import Link from "next/link";
import { AlertCircle, Clock, MessageSquareWarning, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { overviewPendingReviewHref } from "@/lib/overview-nav";
import type { OverviewAttentionItem } from "@/lib/overview-mock";

const ICONS = [TriangleAlert, Clock, MessageSquareWarning, AlertCircle] as const;

export function OverviewAttentionList({ items, hk }: { items: OverviewAttentionItem[]; hk?: string }) {
  return (
    <Card className="flex h-full flex-col rounded-xl border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold">最近待关注事项</h2>
      <ul className="min-h-0 flex-1 space-y-3">
        {items.map((item, index) => {
          const Icon = ICONS[index % ICONS.length];
          return (
            <li key={item.id}>
              <Link href={item.href} scroll={false} className="hover:bg-muted/50 -mx-2 flex items-start gap-3 rounded-lg px-2 py-2 transition-colors">
                <span
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                    item.badgeTone === "danger"
                      ? "bg-red-500/10 text-red-600"
                      : item.badgeTone === "warn"
                        ? "bg-amber-500/10 text-amber-700"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{item.title}</p>
                    {item.badge != null ? (
                      <Badge
                        variant={item.badgeTone === "danger" ? "destructive" : "secondary"}
                        className={cn("shrink-0 tabular-nums", item.badgeTone === "warn" && "border-amber-200 bg-amber-50 text-amber-800")}
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{item.description}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="text-muted-foreground mt-4 text-xs">
        <Link href={overviewPendingReviewHref(hk)} scroll={false} className="text-primary hover:underline">
          查看全部事项 →
        </Link>
      </p>
    </Card>
  );
}
