import { Skeleton } from "@/components/ui/skeleton";

interface NoteListSkeletonProps {
  count?: number;
}

export function NoteListSkeleton({ count = 5 }: NoteListSkeletonProps) {
  return (
    <div className="flex flex-col h-full border-r w-[300px] shrink-0">
      {/* Header */}
      <div className="sticky top-0 p-3 space-y-3 border-b">
        <Skeleton className="h-9 w-full rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 flex-1 rounded-md" />
        </div>
      </div>

      {/* Note items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-md p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
