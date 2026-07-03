import { apiClient } from "@/services/api-client";
import type { ExperienceLevel, Job, JobFacets, JobType, PlanType } from "@/types/job";
import type { PaginationMeta } from "@/types/api";
import { JOBTYPE_TO_ENUMS, SENIORITY_TO_LEVELS, SALARY_FLOOR, SALARY_CEIL, type JobFilters } from "@/features/jobs/job-filters";

export type JobListResponse = { jobs: Job[]; pagination: PaginationMeta; facets: JobFacets };

export type CreateJobPayload = {
  title: string;
  description: string;
  requirements?: string;
  jobType: JobType;
  level: ExperienceLevel;
  salaryMin: number;
  salaryMax: number;
  timezone?: string;
  country?: string;
  benefits?: string[];
  planType: PlanType;
  categoryIds: string[];
  skillIds?: string[];
};

export async function listJobs(query: JobFilters, limit: number): Promise<JobListResponse> {
  const { filters } = query;
  const type = filters.jobType.flatMap((label) => JOBTYPE_TO_ENUMS[label] ?? []);
  const level = filters.seniority.flatMap((label) => SENIORITY_TO_LEVELS[label] ?? []);
  const hasSalaryRange = filters.salaryMin > SALARY_FLOOR || filters.salaryMax < SALARY_CEIL;

  const { data } = await apiClient.get<JobListResponse>("/jobs", {
    params: {
      q: query.q || undefined,
      type: type.length ? type : undefined,
      level: level.length ? level : undefined,
      category: filters.category.length ? filters.category : undefined,
      timezone: filters.timezone.length ? filters.timezone : undefined,
      salaryMin: hasSalaryRange ? filters.salaryMin : undefined,
      salaryMax: hasSalaryRange ? filters.salaryMax : undefined,
      sort: query.sort !== "recent" ? query.sort : undefined,
      page: query.page,
      limit,
    },
  });
  return data;
}

export async function getJob(id: string): Promise<Job> {
  const { data } = await apiClient.get<Job>(`/jobs/${id}`);
  return data;
}

export async function createJob(
  payload: CreateJobPayload
): Promise<{ id: string; slug: string; status: string }> {
  const { data } = await apiClient.post("/jobs", payload);
  return data;
}
