import { Skeleton } from "@/components/ui/skeleton";

const KPI_SKELETON_COUNT = 4;
const TRANSACTION_ROW_SKELETON_COUNT = 5;

export const AdminRevenueSkeleton = () => (
  <div className="flex-1 overflow-hidden">
    <div className="mb-6">
      <Skeleton className="mb-2 h-3 w-16" />
      <Skeleton className="h-7 w-32" />
    </div>

    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: KPI_SKELETON_COUNT }, (_, i) => (
        <Skeleton className="h-20 rounded-12" key={i} />
      ))}
    </div>

    <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_320px]">
      <Skeleton className="h-64 rounded-12" />
      <Skeleton className="h-64 rounded-12" />
    </div>

    <div className="overflow-hidden rounded-12 border border-neutral-100 bg-white p-5">
      <div className="space-y-3">
        {Array.from({ length: TRANSACTION_ROW_SKELETON_COUNT }, (_, i) => (
          <Skeleton className="h-10 w-full rounded-8" key={i} />
        ))}
      </div>
    </div>
  </div>
);
