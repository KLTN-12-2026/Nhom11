import { CompanyLogo } from "@/components/ui/company-logo";
import { companyColor, countryFlag } from "@/features/jobs/jobs.utils";
import type { Job } from "@/types/job";

interface JobCompanyCardProps {
  job: Job;
}

export const JobCompanyCard = ({ job }: JobCompanyCardProps) => {
  const country = job.country ?? job.employer.hqCountry ?? "Remote";
  const color = companyColor(job.employer.companyName);
  const initial = job.employer.companyName.charAt(0).toUpperCase();

  return (
    <div className="rounded-16 border border-neutral-100 bg-white p-5">
      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-neutral-400">Company</h3>
      <div className="mb-3 flex items-center gap-3">
        <CompanyLogo color={color} initial={initial} size={40} />
        <div>
          <p className="text-[14px] font-semibold text-neutral-900">{job.employer.companyName}</p>
          <p className="text-[12px] text-neutral-400">
            {countryFlag(job.country)} {country}
            {job.employer.size ? ` · ${job.employer.size} employees` : ""}
          </p>
        </div>
      </div>
      {job.employer.description && (
        <p className="text-[13px] leading-relaxed text-neutral-500">{job.employer.description}</p>
      )}
    </div>
  );
};
