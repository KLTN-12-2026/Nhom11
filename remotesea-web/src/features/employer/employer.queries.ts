import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEmployerProfile,
  getEmployerProfile,
  listEmployerJobs,
  listJobApplications,
  updateApplicationStatus,
  updateEmployerProfile,
} from "@/features/employer/employer.api";
import { ApiError } from "@/services/api-error";
import { useAuth } from "@/contexts/AuthContext";
import type { ApplicationStatus } from "@/types/application";
import type { EmployerApplicant } from "@/types/employer";

export const EMPLOYER_PROFILE_KEY = ["employer", "profile"];
export const EMPLOYER_JOBS_KEY = ["employer", "jobs"];

export function useEmployerProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: EMPLOYER_PROFILE_KEY,
    queryFn: async () => {
      try {
        return await getEmployerProfile();
      } catch (err) {
        if (err instanceof ApiError && (err.status === 404 || err.status === 403)) return null;
        throw err;
      }
    },
    enabled: !!user && user.role === "EMPLOYER",
  });
}

export function useCreateEmployerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployerProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYER_PROFILE_KEY });
    },
  });
}

export function useUpdateEmployerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEmployerProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(EMPLOYER_PROFILE_KEY, profile);
    },
  });
}

export function useEmployerJobs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: EMPLOYER_JOBS_KEY,
    queryFn: () => listEmployerJobs(),
    enabled: !!user && user.role === "EMPLOYER",
  });
}

export type ApplicantWithJob = EmployerApplicant & { jobId: string; jobTitle: string };

/**
 * GET /employer/jobs only returns a total application count per job, not a status
 * breakdown, and there's no "all applicants across every listing" endpoint. This
 * composes the real per-job endpoint (GET /employer/jobs/:id/applications) across
 * every listing that has at least one application so the dashboard's funnel and
 * recent-applicants panels can be built from real data instead of dropped.
 */
export function useEmployerApplicationsAggregate() {
  const { data: jobsData } = useEmployerJobs();
  const jobs = jobsData?.jobs ?? [];
  const jobIds = jobs.filter((j) => j._count.applications > 0).map((j) => j.id);

  const results = useQueries({
    queries: jobIds.map((jobId) => ({
      queryKey: ["employer", "job-applications", jobId],
      queryFn: () => listJobApplications(jobId, { limit: 50 }),
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const byJobId = new Map<string, EmployerApplicant[]>();
  jobIds.forEach((jobId, i) => {
    byJobId.set(jobId, results[i]?.data?.applications ?? []);
  });

  const all: ApplicantWithJob[] = jobIds.flatMap((jobId) => {
    const job = jobs.find((j) => j.id === jobId);
    return (byJobId.get(jobId) ?? []).map((a) => ({ ...a, jobId, jobTitle: job?.title ?? "" }));
  });

  return { isLoading, applications: all, byJobId };
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: ApplicationStatus; notes?: string }) =>
      updateApplicationStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer", "job-applications"] });
      queryClient.invalidateQueries({ queryKey: EMPLOYER_JOBS_KEY });
    },
  });
}
