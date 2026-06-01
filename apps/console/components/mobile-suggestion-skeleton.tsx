/** 移动处置页骨架 — 与 /m/s/[key] 布局一致，用于 loading.tsx 与 Suspense fallback */
export function MobileSuggestionSkeleton() {
  return (
    <div aria-busy="true" aria-label="加载跟进建议">
      <div className="text-muted-foreground mb-4 h-4 w-20 animate-pulse rounded bg-muted" />

      <div className="mb-3 flex flex-wrap gap-2">
        <div className="bg-muted h-7 w-36 animate-pulse rounded" />
        <div className="bg-muted h-6 w-16 animate-pulse rounded-full" />
        <div className="bg-muted h-6 w-12 animate-pulse rounded-full" />
      </div>

      <div className="bg-muted mb-4 h-3 w-2/3 max-w-xs animate-pulse rounded" />

      <div className="border-primary/10 bg-muted/40 mb-5 rounded-lg border p-4">
        <div className="bg-muted mb-2 h-3 w-16 animate-pulse rounded" />
        <div className="bg-muted mb-2 h-5 w-full animate-pulse rounded" />
        <div className="bg-muted h-4 w-4/5 animate-pulse rounded" />
      </div>

      <div className="text-muted-foreground mb-2 h-3 w-8 animate-pulse rounded bg-muted" />
      <div className="mb-5 grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-muted h-11 animate-pulse rounded-md"
            style={{ animationDelay: `${i * 75}ms` }}
          />
        ))}
      </div>

      <div className="text-muted-foreground mb-2 h-3 w-8 animate-pulse rounded bg-muted" />
      <div className="mb-6 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-muted h-9 flex-1 animate-pulse rounded-md"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>

      <div className="bg-muted h-4 w-32 animate-pulse rounded" />
    </div>
  );
}
