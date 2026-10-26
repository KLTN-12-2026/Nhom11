import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useJobQuery } from "@/features/jobs/jobs.queries";
import { useSalaryBenchmarks } from "@/features/salary/salary.queries";
import { JobHeaderCard } from "@/features/jobs/pages/job-detail/JobHeaderCard";
import { JobDescriptionCard } from "@/features/jobs/pages/job-detail/JobDescriptionCard";
import { JobSkillsCard } from "@/features/jobs/pages/job-detail/JobSkillsCard";
import { JobBenefitsCard } from "@/features/jobs/pages/job-detail/JobBenefitsCard";
import { ApplyCard } from "@/features/jobs/pages/job-detail/ApplyCard";
import { VnSignalCard } from "@/features/jobs/pages/job-detail/VnSignalCard";
import { SalaryBenchmarkCard } from "@/features/jobs/pages/job-detail/SalaryBenchmarkCard";
import { QuickFactsCard } from "@/features/jobs/pages/job-detail/QuickFactsCard";
import { JobCompanyCard } from "@/features/jobs/pages/job-detail/JobCompanyCard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/constants/routes";

export const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, isError } = useJobQuery(id);
  const { data: benchmarks } = useSalaryBenchmarks();
  useDocumentTitle(job ? `${job.title} at ${job.employer.companyName}` : "Job");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1240px] px-6 py-10">
        <Skeleton className="mb-8 h-4 w-24" />
        <Skeleton className="h-40 w-full rounded-16" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Job not found</h1>
        <p className="mt-2 text-sm text-neutral-500">
          This listing may have closed or the link is incorrect.
        </p>
        <Link className="mt-6" to={ROUTES.jobs}>
          <Button variant="primary">Back to jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-10">
      <Link
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        to={ROUTES.jobs}
      >
        <ArrowLeft size={14} /> Back to jobs
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div>
          <JobHeaderCard job={job} />
          <JobDescriptionCard description={job.description} />
          <JobSkillsCard skills={job.skills} />
          <JobBenefitsCard benefits={job.benefits} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="sticky top-6 space-y-4">
            <ApplyCard job={job} />
            <VnSignalCard companyName={job.employer.companyName} vnHireCount={job.vnHireCount} />
            <SalaryBenchmarkCard benchmarks={benchmarks} job={job} />
            <QuickFactsCard job={job} />
            <JobCompanyCard job={job} />
          </div>
        </div>
      </div>
    </div>
  );
};
