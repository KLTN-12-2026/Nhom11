import { apiClient } from "@/services/api-client";
import type { CreateAlertPayload, JobAlert } from "@/types/alert";

export const listAlerts = async (): Promise<JobAlert[]> => {
  const { data } = await apiClient.get<JobAlert[]>("/alerts");
  return data;
};

export const createAlert = async (payload: CreateAlertPayload): Promise<JobAlert> => {
  const { data } = await apiClient.post<JobAlert>("/alerts", payload);
  return data;
};

export const setAlertActive = async (id: string, isActive: boolean): Promise<JobAlert> => {
  const { data } = await apiClient.patch<JobAlert>(`/alerts/${id}`, { isActive });
  return data;
};

export const deleteAlert = async (id: string): Promise<void> => {
  await apiClient.delete(`/alerts/${id}`);
};
