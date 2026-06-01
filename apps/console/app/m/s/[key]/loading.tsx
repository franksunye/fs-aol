export default function MobileSuggestionLoading() {
  return (
    <main className="px-4 py-5">
      <div className="bg-muted mb-4 h-4 w-24 animate-pulse rounded" />
      <div className="bg-muted mb-2 h-8 w-3/4 animate-pulse rounded" />
      <div className="bg-muted mb-6 h-16 w-full animate-pulse rounded-lg" />
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted h-11 animate-pulse rounded-md" />
        <div className="bg-muted h-11 animate-pulse rounded-md" />
        <div className="bg-muted h-11 animate-pulse rounded-md" />
        <div className="bg-muted h-11 animate-pulse rounded-md" />
      </div>
    </main>
  );
}
