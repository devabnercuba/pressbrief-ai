export function GameCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            <div className="h-12 w-12 rounded-lg bg-muted" />
            <div className="h-12 w-12 rounded-lg bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted/70" />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="h-12 w-12 rounded-full bg-muted" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-muted/70" />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted/60" />
        ))}
      </div>
      <div className="mt-5 flex justify-between">
        <div className="h-8 w-32 rounded bg-muted/70" />
        <div className="h-8 w-40 rounded bg-muted/70" />
      </div>
    </div>
  );
}
