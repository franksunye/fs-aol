import { Skeleton } from "@/components/ui/skeleton";
import {
  WorkbenchMetricsSkeleton,
  OpportunityListSkeleton,
} from "@/components/workbench/workbench-skeleton";

export default function WorkbenchLoading() {
  return (
    <main className="w-full px-6 py-8 lg:px-8" aria-busy="true" aria-label="加载工作台">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="mb-4 h-10 w-full max-w-xl rounded-lg" />
      <WorkbenchMetricsSkeleton />
      <OpportunityListSkeleton />
    </main>
  );
}
