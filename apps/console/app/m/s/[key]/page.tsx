import { Suspense } from "react";
import { MobileSuggestionSkeleton } from "@/components/mobile-suggestion-skeleton";
import { MobileSuggestionContent } from "./mobile-suggestion-content";

export const dynamic = "force-dynamic";

export default async function MobileSuggestionAction({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const dedupeKey = decodeURIComponent(key);

  return (
    <main className="px-4 py-5">
      <Suspense fallback={<MobileSuggestionSkeleton />}>
        <MobileSuggestionContent dedupeKey={dedupeKey} />
      </Suspense>
    </main>
  );
}
