import { Skeleton } from "@/components/ui/skeleton";

interface ProjectCardSkeletonProps {
  count?: number;
}

export function ProjectCardSkeleton({ count = 6 }: ProjectCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border bg-card text-card-foreground shadow-sm"
        >
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="p-6 pt-0 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex items-center gap-3 pt-2">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-10" />
            </div>
          </div>
          <div className="flex items-center p-6 pt-0">
            <div className="flex items-center justify-between w-full">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
