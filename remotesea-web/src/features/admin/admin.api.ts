import { apiClient } from "@/services/api-client";
import type { JobStatus } from "@/types/job";
import type { AdminEmployersResponse, AdminJobsResponse, RevenueResponse } from "@/types/admin";

export const listAdminEmployers = async (
  params: { verified?: "true" | "false"; page?: number; limit?: number } = {}
): Promise<AdminEmployersResponse> => {
  const { data } = await apiClient.get<AdminEmployersResponse>("/admin/employers", { params });
  return data;
};

export const updateAdminEmployer = async (
  id: string,
  action: "verify" | "suspend"
): Promise<{ success: true }> => {
  const { data } = await apiClient.patch<{ success: true }>(`/admin/employers/${id}`, { action });
  return data;
};

export const listAdminJobs = async (
  params: { status?: JobStatus; page?: number; limit?: number } = {}
): Promise<AdminJobsResponse> => {
  const { data } = await apiClient.get<AdminJobsResponse>("/admin/jobs", { params });
  return data;
};

export const reviewAdminJob = async (
  id: string,
  action: "approve" | "reject",
  note?: string
): Promise<{ status: JobStatus; publishedAt: string | null }> => {
  const { data } = await apiClient.patch<{ status: JobStatus; publishedAt: string | null }>(
    `/admin/jobs/${id}`,
    { action, note }
  );
  return data;
};

export const getAdminRevenue = async (): Promise<RevenueResponse> => {
  const { data } = await apiClient.get<RevenueResponse>("/admin/revenue");
  return data;
};
