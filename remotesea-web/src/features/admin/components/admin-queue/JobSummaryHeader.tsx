import { CompanyLogo } from "@/components/ui/company-logo";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import {
  colorFor,
  formatSalary,
  hoursSince,
  JOB_TYPE_LABELS,
  LEVEL_LABELS,
  waitCls,
  waitFmt,
} from "@/features/admin/admin.utils";
import type { AdminJob } from "@/types/admin";

const HOURS_PER_DAY = 24;

const submittedLabel = (dateString: string): string => {
  const h = hoursSince(dateString);
  if (h < 1) return "Just now";
  if (h < HOURS_PER_DAY) return `${h}h ago`;
  return `${Math.floor(h / HOURS_PER_DAY)}d ago`;
};

const jobRegion = (j: AdminJob): string => j.country ?? (j.isRemote ? "Remote" : "—");

interface JobSummaryHeaderProps {
  job: AdminJob;
}

export const JobSummaryHeader = ({ job }: JobSummaryHeaderProps) => {
  const waitHours = hoursSince(job.createdAt);
  const tags = [job.categories[0]?.category.name ?? "Other", LEVEL_LABELS[job.level], JOB_TYPE_LABELS[job.jobType], jobRegion(job)];

  return (
    <div className="border-b border-neutral-100 p-5">
      <div className="flex items-start gap-4">
        <CompanyLogo
          color={colorFor(job.employer.companyName)}
          initial={job.employer.companyName.charAt(0).toUpperCase()}
          size={46}
        />
        <div className="flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-neutral-500">Submitted by</span>
            <span className="text-[13px] font-semibold text-neutral-900">{job.employer.companyName}</span>
            <VerifiedBadge isVerified={job.employer.isVerified} size="md" />
          </div>
          <h2 className="mb-2 text-[18px] font-semibold text-neutral-900">{job.title}</h2>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-[12px] text-neutral-600" key={t}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[17px] font-semibold text-neutral-900">
            {formatSalary(job.salaryMin, job.salaryMax, job.currency)}/mo
          </div>
          <div className="text-[12px] text-neutral-400">{submittedLabel(job.createdAt)}</div>
          <span className={`mt-1 inline-block font-mono text-[12px] ${waitCls(waitHours)}`}>
            waited {waitFmt(waitHours)}
          </span>
        </div>
      </div>
    </div>
  );
};
