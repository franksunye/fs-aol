import { Skeleton } from "@/components/ui/skeleton";

export function WorkbenchMetricsSkeleton() {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

export function OpportunityListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="space-y-3" aria-busy="true" aria-label="加载中">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i}>
          <Skeleton className="h-28 rounded-xl" />
        </li>
      ))}
    </ul>
  );
}

export function CaseWorkspaceSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_280px]">
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
