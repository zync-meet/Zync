import { Skeleton } from "@/components/ui/skeleton";

export function TaskListSkeleton() {
  return (
    <div className="space-y-10 max-w-4xl">
      {Array.from({ length: 3 }).map((_, groupIdx) => (
        <div key={groupIdx} className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-6 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-px w-full" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, taskIdx) => (
              <div
                key={taskIdx}
                className="rounded-lg border bg-card p-4 flex items-center gap-4"
              >
                <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-6 rounded-full" />
                <div className="flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
