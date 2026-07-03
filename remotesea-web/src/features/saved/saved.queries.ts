import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listSavedJobs, toggleSavedJob } from "@/features/saved/saved.api";
import { useAuth } from "@/contexts/AuthContext";

export const SAVED_JOBS_KEY = ["saved-jobs"];

export function useSavedJobs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: SAVED_JOBS_KEY,
    queryFn: listSavedJobs,
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useToggleSavedJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleSavedJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_JOBS_KEY });
    },
  });
}
