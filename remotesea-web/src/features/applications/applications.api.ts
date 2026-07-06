import { apiClient } from "@/services/api-client";
import type { Application, ApplicationWithJob } from "@/types/application";

export type ApplyPayload = { jobId: string; coverLetter?: string; resumeUrl?: string };

export const applyToJob = async (payload: ApplyPayload): Promise<Application> => {
  const { data } = await apiClient.post<Application>("/applications", payload);
  return data;
};

export const listMyApplications = async (): Promise<ApplicationWithJob[]> => {
  const { data } = await apiClient.get<ApplicationWithJob[]>("/applications");
  return data;
};
