import { Clock, ShieldCheck, Users } from "lucide-react";
import { CompanyLogo } from "@/components/ui/company-logo";
import { Badge } from "@/components/ui/badge";
import { SalaryBadge } from "@/components/ui/salary-badge";
import { Tag } from "@/components/ui/tag";
import { JOB_TYPE_LABELS, LEVEL_LABELS, companyColor, countryFlag, timeAgo } from "@/features/jobs/jobs.utils";
import type { Job } from "@/types/job";

interface JobHeaderCardProps {
  job: Job;
}

export const JobHeaderCard = ({ job }: JobHeaderCardProps) => {
  const country = job.country ?? job.employer.hqCountry ?? "Remote";
  const timezone = job.timezone ?? (job.isRemote ? "Remote" : country);
  const category = job.categories[0]?.category.name ?? "Other";
  const color = companyColor(job.employer.companyName);
  const initial = job.employer.companyName.charAt(0).toUpperCase();

  return (
    <div className="mb-6 flex items-start gap-4 rounded-16 border border-neutral-100 bg-white p-6 shadow-card">
      <CompanyLogo color={color} initial={initial} size={56} />
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2 text-sm text-neutral-400">
          {job.employer.isVerified && (
            <span className="inline-flex items-center gap-1 text-brand-600">
              <ShieldCheck size={13} /> Verified employer
            </span>
          )}
          {job.employer.isVerified && <span>·</span>}
          <span>
            {countryFlag(job.country)} {country}
          </span>
        </div>
        <h1 className="mb-1 text-[22px] font-semibold text-neutral-900">{job.title}</h1>
        <p className="text-[15px] text-neutral-500">{job.employer.companyName}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {job.isFeatured && <Badge variant="featured">⭐ Featured</Badge>}
          <Tag>{category}</Tag>
          <Tag>{LEVEL_LABELS[job.level]}</Tag>
          <Tag>{JOB_TYPE_LABELS[job.jobType]}</Tag>
          <Tag>{timezone}</Tag>
          {job.vnHireCount > 0 && (
            <Badge variant="vn">
              <Users size={10} /> {job.vnHireCount} VN on team
            </Badge>
          )}
        </div>
      </div>
      <div className="hidden flex-col items-end gap-2 sm:flex">
        <SalaryBadge max={job.salaryMax ?? 0} min={job.salaryMin ?? 0} />
        <span className="inline-flex items-center gap-1 text-[12px] text-neutral-400">
          <Clock size={11} /> Posted {timeAgo(job.publishedAt ?? job.createdAt)} ago
        </span>
      </div>
    </div>
  );
};
