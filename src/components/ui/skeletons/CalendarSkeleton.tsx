import { Skeleton } from "@/components/ui/skeleton";

export function CalendarSkeleton() {
  return (
    <div className="flex-1 p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center py-2 text-xs text-muted-foreground font-medium"
          >
            {day}
          </div>
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[80px] border-t border-l p-1 last:border-r first:border-l"
          >
            <Skeleton className="h-4 w-4 mb-1" />
            {i % 4 === 0 && (
              <Skeleton className="h-4 w-full rounded-sm mt-1" />
            )}
            {i % 6 === 0 && (
              <Skeleton className="h-4 w-3/4 rounded-sm mt-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
