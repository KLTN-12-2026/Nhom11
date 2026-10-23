import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CompanyLogo } from "@/components/ui/company-logo";
import { SalaryBadge } from "@/components/ui/salary-badge";
import { Tag } from "@/components/ui/tag";
import { useJobsQuery } from "@/features/jobs/jobs.queries";
import { DEFAULT_FILTERS } from "@/features/jobs/job-filters";
import { companyColor, countryFlag } from "@/features/jobs/jobs.utils";
import { ROUTES } from "@/constants/routes";
import type { ApplicationWithJob } from "@/types/application";

const RECOMMENDED_JOBS_LIMIT = 20;
const RECOMMENDED_JOBS_DISPLAY_COUNT = 3;
const WHY_SKILLS_DISPLAY_COUNT = 2;
const TAGS_DISPLAY_COUNT = 3;

interface RecommendedJobsProps {
  applications: ApplicationWithJob[];
}

export const RecommendedJobs = ({ applications }: RecommendedJobsProps) => {
  const { data } = useJobsQuery(DEFAULT_FILTERS, RECOMMENDED_JOBS_LIMIT);
  const appliedIds = new Set(applications.map((a) => a.jobId));
  const recommended = (data?.jobs ?? [])
    .filter((j) => !appliedIds.has(j.id))
    .slice(0, RECOMMENDED_JOBS_DISPLAY_COUNT);

  if (recommended.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-16 border border-neutral-100 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <h3 className="text-[14px] font-semibold text-neutral-900">
          Picked for you <span className="font-normal text-neutral-400">· newest &amp; featured</span>
        </h3>
        <Link className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 hover:text-brand-700" to={ROUTES.jobs}>
          Browse all jobs <ArrowRight size={12} />
        </Link>
      </div>
      <div>
        {recommended.map((job) => {
          const why =
            job.skills.slice(0, WHY_SKILLS_DISPLAY_COUNT).map((s) => s.skill.name).join(" + ") ||
            "Matches your profile";
          const country = job.country ?? "Remote";
          return (
            <Link
              className="flex items-center gap-4 border-b border-neutral-50 px-5 py-4 transition-colors last:border-none hover:bg-neutral-50/60"
              key={job.id}
              to={`/jobs/${job.id}`}
            >
              <CompanyLogo color={companyColor(job.employer.companyName)} initial={job.employer.companyName.charAt(0).toUpperCase()} size={40} />
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-1.5 text-[11.5px] text-neutral-400">
                  <span>{job.employer.companyName}</span>
                  <span className="h-1 w-1 rounded-full bg-neutral-300" />
                  <span>{countryFlag(job.country)} {country}</span>
                </div>
                <p className="mb-1 text-[13.5px] font-medium text-neutral-900">{job.title}</p>
                <div className="flex flex-wrap gap-1">
                  {job.skills.slice(0, TAGS_DISPLAY_COUNT).map(({ skill }) => (
                    <Tag key={skill.id}>{skill.name}</Tag>
                  ))}
                </div>
              </div>
              <div className="hidden flex-shrink-0 flex-col items-end gap-1.5 md:flex">
                <span className="text-right text-[11px] text-neutral-400">{why}</span>
              </div>
              <SalaryBadge max={job.salaryMax ?? 0} min={job.salaryMin ?? 0} />
            </Link>
          );
        })}
      </div>
    </div>
  );
};
