import { Skeleton } from "@/components/ui/skeleton";

export function EditorSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-md" />
        ))}
        <div className="flex-1" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-16 py-12 space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-1/3" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
