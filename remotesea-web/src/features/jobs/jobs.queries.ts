import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { createJob, getJob, listJobs } from "@/features/jobs/jobs.api";
import { JOB_LIMIT, type JobFilters } from "@/features/jobs/job-filters";

export function useJobsQuery(filters: JobFilters, limit: number = JOB_LIMIT) {
  return useQuery({
    queryKey: ["jobs", filters, limit],
    queryFn: () => listJobs(filters, limit),
    placeholderData: keepPreviousData,
  });
}

export function useJobQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () => getJob(id as string),
    enabled: !!id,
  });
}

export function useCreateJob() {
  return useMutation({ mutationFn: createJob });
}
