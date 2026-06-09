import { Skeleton } from "@/components/ui/skeleton";
import { CaseWorkspaceSkeleton } from "@/components/workbench/workbench-skeleton";

export default function SuggestionDetailLoading() {
  return (
    <main className="w-full px-6 py-6 lg:px-8" aria-busy="true" aria-label="加载案件">
      <Skeleton className="mb-4 h-4 w-24" />
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-6 h-16 w-full rounded-lg" />
      <CaseWorkspaceSkeleton />
    </main>
  );
}
