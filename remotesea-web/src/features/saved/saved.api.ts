import { apiClient } from "@/services/api-client";
import type { Job } from "@/types/job";

export type SavedJob = { userId: string; jobId: string; createdAt: string; job: Job };

export const listSavedJobs = async (): Promise<SavedJob[]> => {
  const { data } = await apiClient.get<SavedJob[]>("/saved");
  return data;
};

export const toggleSavedJob = async (jobId: string): Promise<{ saved: boolean }> => {
  const { data } = await apiClient.post<{ saved: boolean }>("/saved", { jobId });
  return data;
};
