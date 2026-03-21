export default function ResultsLoading() {
  return (
    <main className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-[480px] px-6 py-10 md:py-16">
        <div className="flex flex-col items-center text-center">
          {/* Label skeleton */}
          <div className="h-3 w-24 rounded bg-bg-card animate-pulse mb-5" />

          {/* Score skeleton */}
          <div className="h-20 w-32 rounded-xl bg-bg-card animate-pulse mb-4" />

          {/* Percentile skeleton */}
          <div className="h-6 w-40 rounded-full bg-bg-card animate-pulse mb-8" />

          {/* Sub-scores grid skeleton */}
          <div className="grid grid-cols-3 gap-2.5 w-full mb-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-bg-card animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>

          {/* Score killer skeleton */}
          <div className="h-px w-full bg-white/[0.06] mb-6" />
          <div className="w-full h-20 rounded-xl bg-bg-card animate-pulse mb-6" />

          {/* Share button skeleton */}
          <div className="w-full h-14 rounded-xl bg-bg-card animate-pulse" />
        </div>
      </div>
    </main>
  );
}
