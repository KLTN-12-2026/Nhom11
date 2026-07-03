import { apiClient } from "@/services/api-client";
import type { Application, ApplicationWithJob } from "@/types/application";

export type ApplyPayload = { jobId: string; coverLetter?: string; resumeUrl?: string };

export async function applyToJob(payload: ApplyPayload): Promise<Application> {
  const { data } = await apiClient.post<Application>("/applications", payload);
  return data;
}

export async function listMyApplications(): Promise<ApplicationWithJob[]> {
  const { data } = await apiClient.get<ApplicationWithJob[]>("/applications");
  return data;
}
