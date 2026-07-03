import { apiClient } from "@/services/api-client";
import type { CreateAlertPayload, JobAlert } from "@/types/alert";

export async function listAlerts(): Promise<JobAlert[]> {
  const { data } = await apiClient.get<JobAlert[]>("/alerts");
  return data;
}

export async function createAlert(payload: CreateAlertPayload): Promise<JobAlert> {
  const { data } = await apiClient.post<JobAlert>("/alerts", payload);
  return data;
}

export async function setAlertActive(id: string, isActive: boolean): Promise<JobAlert> {
  const { data } = await apiClient.patch<JobAlert>(`/alerts/${id}`, { isActive });
  return data;
}

export async function deleteAlert(id: string): Promise<void> {
  await apiClient.delete(`/alerts/${id}`);
}
