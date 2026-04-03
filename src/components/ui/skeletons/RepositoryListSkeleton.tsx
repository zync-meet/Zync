import { Skeleton } from "@/components/ui/skeleton";

interface RepositoryListSkeletonProps {
  count?: number;
}

export function RepositoryListSkeleton({ count = 6 }: RepositoryListSkeletonProps) {
  return (
    <div className="flex-1 p-8 h-full">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>

        {/* Project grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border bg-card text-card-foreground shadow-sm"
            >
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
