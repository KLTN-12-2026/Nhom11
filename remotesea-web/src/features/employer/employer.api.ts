import { apiClient } from "@/services/api-client";
import type { ApplicationStatus } from "@/types/application";
import type { JobStatus } from "@/types/job";
import type {
  CreateEmployerProfilePayload,
  EmployerJobApplicationsResponse,
  EmployerJobsResponse,
  EmployerProfileSummary,
  UpdateEmployerProfilePayload,
} from "@/types/employer";

export async function createEmployerProfile(
  payload: CreateEmployerProfilePayload
): Promise<{ id: string; slug: string; companyName: string }> {
  const { data } = await apiClient.post("/employer/profile", payload);
  return data;
}

export async function getEmployerProfile(): Promise<EmployerProfileSummary> {
  const { data } = await apiClient.get<EmployerProfileSummary>("/employer/profile");
  return data;
}

export async function updateEmployerProfile(
  payload: UpdateEmployerProfilePayload
): Promise<EmployerProfileSummary> {
  const { data } = await apiClient.patch<EmployerProfileSummary>("/employer/profile", payload);
  return data;
}

export async function listEmployerJobs(status?: JobStatus): Promise<EmployerJobsResponse> {
  const { data } = await apiClient.get<EmployerJobsResponse>("/employer/jobs", {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function listJobApplications(
  jobId: string,
  params: { status?: ApplicationStatus; page?: number; limit?: number } = {}
): Promise<EmployerJobApplicationsResponse> {
  const { data } = await apiClient.get<EmployerJobApplicationsResponse>(
    `/employer/jobs/${jobId}/applications`,
    { params }
  );
  return data;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  notes?: string
): Promise<void> {
  await apiClient.patch(`/employer/applications/${applicationId}`, { status, notes });
}
