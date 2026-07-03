import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAdminEmployers,
  listAdminJobs,
  reviewAdminJob,
  updateAdminEmployer,
} from "@/features/admin/admin.api";
import { useAuth } from "@/contexts/AuthContext";
import type { JobStatus } from "@/types/job";

export const ADMIN_JOBS_KEY = ["admin", "jobs"];
export const ADMIN_EMPLOYERS_KEY = ["admin", "employers"];

export function useAdminJobs(status: JobStatus = "PENDING_REVIEW") {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...ADMIN_JOBS_KEY, status],
    queryFn: () => listAdminJobs({ status, limit: 50 }),
    enabled: !!user && user.role === "ADMIN",
  });
}

export function useAdminEmployers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ADMIN_EMPLOYERS_KEY,
    queryFn: () => listAdminEmployers({ limit: 50 }),
    enabled: !!user && user.role === "ADMIN",
  });
}

export function useReviewAdminJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: "approve" | "reject"; note?: string }) =>
      reviewAdminJob(id, action, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_JOBS_KEY });
    },
  });
}

export function useUpdateAdminEmployer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "verify" | "suspend" }) =>
      updateAdminEmployer(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_EMPLOYERS_KEY });
    },
  });
}
