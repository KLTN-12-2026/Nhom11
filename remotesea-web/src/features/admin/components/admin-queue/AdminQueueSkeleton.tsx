import { Skeleton } from "@/components/ui/skeleton";

const KPI_SKELETON_COUNT = 4;
const ROW_SKELETON_COUNT = 5;

export const AdminQueueSkeleton = () => (
  <div className="flex-1 overflow-hidden">
    <div className="mb-6">
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="h-7 w-40" />
    </div>

    <div className="mb-6 grid grid-cols-4 gap-3">
      {Array.from({ length: KPI_SKELETON_COUNT }, (_, i) => (
        <Skeleton className="h-20 rounded-12" key={i} />
      ))}
    </div>

    <div className="grid gap-4" style={{ gridTemplateColumns: "280px 1fr" }}>
      <div className="space-y-2 rounded-12 border border-neutral-100 bg-white p-4">
        {Array.from({ length: ROW_SKELETON_COUNT }, (_, i) => (
          <Skeleton className="h-16 rounded-10" key={i} />
        ))}
      </div>
      <Skeleton className="h-[420px] rounded-12" />
    </div>
  </div>
);
