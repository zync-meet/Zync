import { Skeleton } from "@/components/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Tabs */}
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-md" />
          ))}
        </div>

        {/* Profile section */}
        <div className="rounded-lg border bg-card p-6 space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="flex justify-center">
            <Skeleton className="h-24 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Integration cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border bg-card p-6 flex items-center gap-4"
            >
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
