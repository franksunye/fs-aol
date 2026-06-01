/** 移动处置页骨架 — 浅色卡片布局 */
export function MobileSuggestionSkeleton() {
  return (
    <div aria-busy="true" aria-label="加载跟进建议" className="space-y-3 pb-6">
      <div className="overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm">
        <div className="space-y-3 p-4">
          <div className="h-6 w-40 animate-pulse rounded bg-zinc-100" />
          <div className="flex gap-2">
            <div className="h-5 w-16 animate-pulse rounded-md bg-zinc-100" />
            <div className="h-5 w-10 animate-pulse rounded-md bg-zinc-100" />
            <div className="h-5 w-14 animate-pulse rounded-md bg-zinc-100" />
          </div>
          <div className="h-4 w-56 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="border-t border-zinc-100 bg-blue-50/50 p-4">
          <div className="flex gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-blue-100" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-16 animate-pulse rounded bg-blue-100" />
              <div className="h-5 w-full animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-100 p-4">
          <div className="h-12 w-full animate-pulse rounded bg-zinc-100" />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
        <div className="mb-3 h-5 w-10 animate-pulse rounded bg-zinc-100" />
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-11 animate-pulse rounded-lg bg-zinc-100"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-5 w-10 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-14 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-100" />
          ))}
        </div>
        <div className="h-20 animate-pulse rounded-lg bg-zinc-50" />
      </div>

      <div className="h-12 animate-pulse rounded-xl bg-white shadow-sm" />
    </div>
  );
}
