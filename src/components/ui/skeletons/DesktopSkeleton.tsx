import { Skeleton } from "@/components/ui/skeleton";

export function DesktopSkeleton() {
  return (
    <div className="h-screen w-full bg-black flex items-center justify-center">
      <div className="flex items-center gap-3 text-white/40">
        <Skeleton className="h-8 w-8 rounded-md bg-white/10" />
        <Skeleton className="h-4 w-32 bg-white/10" />
      </div>
    </div>
  );
}
