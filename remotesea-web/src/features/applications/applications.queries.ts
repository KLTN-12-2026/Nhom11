import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applyToJob, listMyApplications } from "@/features/applications/applications.api";
import { useAuth } from "@/contexts/AuthContext";

export const MY_APPLICATIONS_KEY = ["my-applications"];

export function useMyApplications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: MY_APPLICATIONS_KEY,
    queryFn: listMyApplications,
    enabled: !!user,
  });
}

export function useApplyToJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applyToJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_APPLICATIONS_KEY });
    },
  });
}
