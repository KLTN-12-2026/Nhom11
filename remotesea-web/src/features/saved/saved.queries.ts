import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listSavedJobs, toggleSavedJob } from "@/features/saved/saved.api";
import { useAuth } from "@/contexts/AuthContext";

export const SAVED_JOBS_KEY = ["saved-jobs"];

const SAVED_JOBS_STALE_TIME_MS = 30_000;

export const useSavedJobs = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: SAVED_JOBS_KEY,
    queryFn: listSavedJobs,
    enabled: !!user,
    staleTime: SAVED_JOBS_STALE_TIME_MS,
  });
};

export const useToggleSavedJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleSavedJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_JOBS_KEY });
    },
  });
};
