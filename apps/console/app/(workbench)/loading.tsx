import { Skeleton } from "@/components/ui/skeleton";
import {
  ActionReviewMetricsSkeleton,
  ActionReviewListSkeleton,
} from "@/components/action-center/action-center-skeleton";

export default function ActionCenterLoading() {
  return (
    <main
      className="h-full w-full overflow-y-auto px-6 py-8 lg:px-8"
      aria-busy="true"
      aria-label="加载 Action 中心"
    >
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="mb-4 h-10 w-full max-w-xl rounded-lg" />
      <ActionReviewMetricsSkeleton />
      <ActionReviewListSkeleton />
    </main>
  );
}
