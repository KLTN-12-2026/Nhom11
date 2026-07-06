import { ApplyButton } from "@/features/jobs/components/ApplyButton";
import { SaveJobButton } from "@/features/jobs/components/SaveJobButton";
import { MS_PER_DAY, timeAgo } from "@/features/jobs/jobs.utils";
import type { Job } from "@/types/job";

const daysUntil = (dateString: string | null): number | null => {
  if (!dateString) return null;
  const diff = new Date(dateString).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / MS_PER_DAY));
};

interface ApplyCardProps {
  job: Job;
}

export const ApplyCard = ({ job }: ApplyCardProps) => {
  const country = job.country ?? job.employer.hqCountry ?? "Remote";
  const expiresInDays = daysUntil(job.expiresAt);

  return (
    <div className="rounded-16 border border-brand-100 bg-brand-50 p-6">
      <div className="mb-1 font-mono text-[22px] font-semibold text-neutral-900">
        ${(job.salaryMin ?? 0).toLocaleString()}–{(job.salaryMax ?? 0).toLocaleString()}
        <span className="text-[14px] font-normal text-neutral-500"> /mo</span>
      </div>
      <p className="mb-5 text-[12px] text-neutral-400">
        {job.currency} · paid via {country === "US" ? "Deel or Wise" : "Wise or local TT"}
      </p>
      <ApplyButton jobId={job.id} />
      <SaveJobButton jobId={job.id} />
      <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-neutral-400">Posted</span>
          <span className="font-medium text-neutral-700">{timeAgo(job.publishedAt ?? job.createdAt)} ago</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-neutral-400">Applicants so far</span>
          <span className="font-medium text-neutral-700">{job.applyCount}</span>
        </div>
        {expiresInDays !== null && (
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-neutral-400">Expires in</span>
            <span className="font-medium text-neutral-700">{expiresInDays} days</span>
          </div>
        )}
      </div>
    </div>
  );
};
