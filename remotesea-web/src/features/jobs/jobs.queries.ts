import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { createJob, getJob, listJobs } from "@/features/jobs/jobs.api";
import { JOB_LIMIT, type JobFilters } from "@/features/jobs/job-filters";

export const useJobsQuery = (filters: JobFilters, limit: number = JOB_LIMIT) =>
  useQuery({
    queryKey: ["jobs", filters, limit],
    queryFn: () => listJobs(filters, limit),
    placeholderData: keepPreviousData,
  });

export const useJobQuery = (id: string | undefined) =>
  useQuery({
    queryKey: ["job", id],
    queryFn: () => getJob(id as string),
    enabled: !!id,
  });

export const useCreateJob = () => useMutation({ mutationFn: createJob });
