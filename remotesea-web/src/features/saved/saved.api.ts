import { apiClient } from "@/services/api-client";
import type { Job } from "@/types/job";

export type SavedJob = { userId: string; jobId: string; createdAt: string; job: Job };

export const listSavedJobs = async (): Promise<SavedJob[]> => {
  const { data } = await apiClient.get<SavedJob[]>("/saved");
  return data;
};

export const saveJob = async (jobId: string): Promise<{ saved: boolean }> => {
  const { data } = await apiClient.put<{ saved: boolean }>(`/saved/${jobId}`);
  return data;
};

export const unsaveJob = async (jobId: string): Promise<{ saved: boolean }> => {
  const { data } = await apiClient.delete<{ saved: boolean }>(`/saved/${jobId}`);
  return data;
};
