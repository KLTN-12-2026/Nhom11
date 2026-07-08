import { memo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Plus } from "lucide-react";
import { cn } from "@/utils/cn";
import { EmptyRow } from "@/components/shared/EmptyRow";
import { STATUS_GROUP, STATUS_LABEL, timeAgo } from "@/features/employer/employer-dashboard.utils";
import type { EmployerApplicant, EmployerJobListItem } from "@/types/employer";

const STATUS_MAP: Record<string, string> = {
  review: "bg-amber-50 text-amber-700 border-amber-200",
  live: "bg-brand-50 text-brand-700 border-brand-200",
  closed: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

// Stable fallback so jobs with no applications don't break the row's memo
// comparison with a freshly-allocated empty array on every render.
const EMPTY_APPLICATIONS: EmployerApplicant[] = [];

interface ListingRowProps {
  job: EmployerJobListItem;
  applications: EmployerApplicant[];
}

const ListingRow = memo(function ListingRow({ job: j, applications: apps }: ListingRowProps) {
  const total = j._count.applications;
  const reviewed = apps.filter((a) => a.status !== "PENDING").length;
  const shortlisted = apps.filter((a) => a.status === "SHORTLISTED").length;
  const newApps = apps.filter((a) => a.status === "PENDING").length;
  const reviewPct = total ? Math.round((reviewed / total) * 100) : 0;
  const shortPct = total ? Math.round((shortlisted / total) * 100) : 0;

  // The public job detail page only serves ACTIVE listings (drafts, pending
  // review, closed, and rejected jobs 404 there by design) — so only link an
  // employer's own row through when it's actually live; otherwise render the
  // same row without navigation instead of sending them to a broken page.
  const isPubliclyViewable = j.status === "ACTIVE";

  const rowContent = (
    <>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13.5px] font-medium text-neutral-900">{j.title}</span>
          {j.planType === "FEATURED" && (
            <span className="flex-shrink-0 rounded-full bg-brand-600 px-1.5 py-0.5 text-[9.5px] font-bold text-white">
              Featured
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11.5px] text-neutral-400">
          <span>{timeAgo(j.publishedAt ?? j.createdAt)}</span>
        </div>
      </div>

      <span
        className={cn(
          "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
          STATUS_MAP[STATUS_GROUP[j.status]]
        )}
      >
        {STATUS_LABEL[j.status]}
      </span>

      {total > 0 ? (
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-neutral-900">{total}</span>
            {newApps > 0 && (
              <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                +{newApps} new
              </span>
            )}
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <span className="absolute h-full rounded-full bg-amber-300" style={{ width: `${reviewPct}%` }} />
            <span className="absolute h-full rounded-full bg-brand-500" style={{ width: `${shortPct}%` }} />
          </div>
        </div>
      ) : (
        <span className="text-[12px] italic text-neutral-400">Awaiting</span>
      )}

      <div className="text-center">
        <div className="text-[13px] font-semibold text-neutral-700">{j.viewCount}</div>
        <div className="text-[10px] text-neutral-400">views</div>
      </div>

      {isPubliclyViewable ? <ChevronRight className="text-neutral-300" size={14} /> : <span />}
    </>
  );

  if (isPubliclyViewable) {
    return (
      <Link
        className="grid cursor-pointer grid-cols-[1fr_80px_120px_60px_32px] items-center gap-3 rounded-12 px-2 py-3 transition-colors hover:bg-neutral-50"
        to={`/jobs/${j.id}`}
      >
        {rowContent}
      </Link>
    );
  }

  return (
    <div
      className="grid grid-cols-[1fr_80px_120px_60px_32px] items-center gap-3 rounded-12 px-2 py-3"
      title="This listing isn't live yet, so it doesn't have a public page to view."
    >
      {rowContent}
    </div>
  );
});

interface ListingsPanelProps {
  jobs: EmployerJobListItem[];
  applicationsByJob: Map<string, EmployerApplicant[]>;
}

export const ListingsPanel = ({ jobs, applicationsByJob }: ListingsPanelProps) => {
  const active = jobs.filter((j) => STATUS_GROUP[j.status] !== "closed").length;

  return (
    <div className="rounded-20 border border-neutral-100 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-neutral-900">
          Your listings <span className="font-normal text-neutral-400">· {active} active</span>
        </h3>
        <Link
          className="inline-flex items-center gap-1.5 rounded-10 bg-brand-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-700"
          to="/post-job"
        >
          <Plus size={11} /> Post a job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <EmptyRow>No listings yet. Post your first job to start hiring.</EmptyRow>
      ) : (
        <>
          <div className="mb-1 grid grid-cols-[1fr_80px_120px_60px_32px] gap-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            <span>Role</span>
            <span>Status</span>
            <span>Applications</span>
            <span>Views</span>
            <span />
          </div>

          <div className="divide-y divide-neutral-50">
            {jobs.map((j) => (
              <ListingRow applications={applicationsByJob.get(j.id) ?? EMPTY_APPLICATIONS} job={j} key={j.id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
