import { Skeleton } from "@/components/ui/skeleton";

const KPI_SKELETON_COUNT = 3;
const ROW_SKELETON_COUNT = 6;
const EMPLOYER_GRID_COLUMNS = "1fr 90px 140px 100px 32px";

export const AdminEmployersSkeleton = () => (
  <div className="flex-1 overflow-hidden">
    <div className="mb-6">
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="h-7 w-32" />
    </div>

    <div className="mb-6 grid grid-cols-3 gap-3">
      {Array.from({ length: KPI_SKELETON_COUNT }, (_, i) => (
        <Skeleton className="h-20 rounded-12" key={i} />
      ))}
    </div>

    <div className="overflow-hidden rounded-12 border border-neutral-100 bg-white">
      {Array.from({ length: ROW_SKELETON_COUNT }, (_, i) => (
        <div
          className="grid items-center gap-3 border-b border-neutral-50 px-5 py-4 last:border-0"
          key={i}
          style={{ gridTemplateColumns: EMPLOYER_GRID_COLUMNS }}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 flex-shrink-0 rounded-10" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-6 rounded-6" />
        </div>
      ))}
    </div>
  </div>
);
