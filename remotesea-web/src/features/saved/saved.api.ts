import { apiClient } from "@/services/api-client";
import type { Job } from "@/types/job";

export type SavedJob = { userId: string; jobId: string; createdAt: string; job: Job };

export async function listSavedJobs(): Promise<SavedJob[]> {
  const { data } = await apiClient.get<SavedJob[]>("/saved");
  return data;
}

export async function toggleSavedJob(jobId: string): Promise<{ saved: boolean }> {
  const { data } = await apiClient.post<{ saved: boolean }>("/saved", { jobId });
  return data;
}
