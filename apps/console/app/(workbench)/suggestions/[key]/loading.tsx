import { Skeleton } from "@/components/ui/skeleton";

export default function SuggestionDetailLoading() {
  return (
    <main
      className="mx-auto w-full max-w-[1400px] px-6 py-6 lg:px-8"
      aria-busy="true"
      aria-label="加载案件"
    >
      <Skeleton className="mb-4 h-4 w-24" />
      <Skeleton className="mb-5 h-9 w-56" />
      <Skeleton className="mb-5 h-28 w-full rounded-xl" />
      <Skeleton className="mb-5 h-36 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </main>
  );
}
