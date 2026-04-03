import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Profile header card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <Skeleton className="h-20 w-20 rounded-full shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
            <div className="flex gap-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Contribution graph section */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="grid grid-cols-[repeat(52,1fr)] gap-[3px]">
            {Array.from({ length: 7 * 52 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-[10px] w-full rounded-sm"
              />
            ))}
          </div>
        </div>
        <div className="md:w-32 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
      </div>

      {/* Bottom cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-36" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-[200px] w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
