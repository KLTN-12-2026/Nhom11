import { apiClient } from "@/services/api-client";

export async function createCheckoutSession(jobId: string): Promise<{ url: string | null }> {
  const { data } = await apiClient.post<{ url: string | null }>("/billing/checkout", { jobId });
  return data;
}
