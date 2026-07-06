import { cn } from "@/utils/cn";
import { STATUS_TO_BUCKET, type AppStatusBucket } from "@/features/talent/talent-dashboard.utils";
import type { ApplicationWithJob } from "@/types/application";

interface PipelineProps {
  applications: ApplicationWithJob[];
}

export const Pipeline = ({ applications }: PipelineProps) => {
  const countByBucket = (bucket: AppStatusBucket) =>
    applications.filter((a) => STATUS_TO_BUCKET[a.status] === bucket).length;
  const stages: { label: string; n: number; active?: boolean }[] = [
    { label: "Applied", n: countByBucket("applied") },
    { label: "In review", n: countByBucket("review") },
    { label: "Interviewing", n: countByBucket("interview"), active: true },
    { label: "Offers", n: countByBucket("offer") },
    { label: "Closed", n: countByBucket("closed") },
  ];
  return (
    <div className="flex border-b border-neutral-100 bg-neutral-50/50">
      {stages.map((s, i) => (
        <div
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 px-2 py-3 text-center",
            i < stages.length - 1 && "border-r border-neutral-100",
            s.active && "border-b-2 border-brand-600 bg-white"
          )}
          key={s.label}
        >
          <span
            className={cn(
              "font-mono text-[20px] font-semibold leading-none tracking-tight",
              s.active ? "text-brand-700" : "text-neutral-900"
            )}
          >
            {s.n.toString().padStart(2, "0")}
          </span>
          <span className={cn("text-[11px]", s.active ? "font-medium text-brand-600" : "text-neutral-400")}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
};
