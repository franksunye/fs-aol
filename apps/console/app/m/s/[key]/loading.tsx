import { MobileSuggestionSkeleton } from "@/components/mobile-suggestion-skeleton";

/** 路由切换 / 首包：与 Suspense fallback 同一骨架，尽快可见 */
export default function MobileSuggestionLoading() {
  return <MobileSuggestionSkeleton />;
}
