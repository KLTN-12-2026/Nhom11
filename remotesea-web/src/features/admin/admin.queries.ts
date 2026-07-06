import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminRevenue,
  listAdminEmployers,
  listAdminJobs,
  reviewAdminJob,
  updateAdminEmployer,
} from "@/features/admin/admin.api";
import { useAuth } from "@/contexts/AuthContext";
import type { JobStatus } from "@/types/job";

export const ADMIN_JOBS_KEY = ["admin", "jobs"];
export const ADMIN_EMPLOYERS_KEY = ["admin", "employers"];
export const ADMIN_REVENUE_KEY = ["admin", "revenue"];

const ADMIN_LIST_LIMIT = 50;

export const useAdminJobs = (status: JobStatus = "PENDING_REVIEW") => {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...ADMIN_JOBS_KEY, status],
    queryFn: () => listAdminJobs({ status, limit: ADMIN_LIST_LIMIT }),
    enabled: !!user && user.role === "ADMIN",
  });
};

export const useAdminEmployers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ADMIN_EMPLOYERS_KEY,
    queryFn: () => listAdminEmployers({ limit: ADMIN_LIST_LIMIT }),
    enabled: !!user && user.role === "ADMIN",
  });
};

export const useReviewAdminJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: "approve" | "reject"; note?: string }) =>
      reviewAdminJob(id, action, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_JOBS_KEY });
    },
  });
};

export const useUpdateAdminEmployer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "verify" | "suspend" }) =>
      updateAdminEmployer(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_EMPLOYERS_KEY });
    },
  });
};

export const useAdminRevenue = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ADMIN_REVENUE_KEY,
    queryFn: getAdminRevenue,
    enabled: !!user && user.role === "ADMIN",
  });
};
