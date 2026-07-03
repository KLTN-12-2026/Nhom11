import { Skeleton } from "@/components/ui/skeleton";

export function JobCardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-12 border border-neutral-100 bg-white p-5">
      <Skeleton className="h-11 w-11 flex-shrink-0 rounded-10" />
      <div className="min-w-0 flex-1 space-y-2.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-4 w-64" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}
