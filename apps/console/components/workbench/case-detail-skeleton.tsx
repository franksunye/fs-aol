import { Skeleton } from "@/components/ui/skeleton";

export function CaseDetailSkeleton() {
  return (
    <div
      className="px-4 py-4 lg:px-5 lg:py-5"
      aria-busy="true"
      aria-label="加载案件详情"
    >
      <div className="mb-4 flex justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="size-8 rounded-lg" />
      </div>
      <Skeleton className="mb-4 h-28 w-full rounded-xl" />
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
