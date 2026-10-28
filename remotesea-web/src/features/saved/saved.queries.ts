import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listSavedJobs, saveJob, unsaveJob, type SavedJob } from "@/features/saved/saved.api";
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

export const useSaveJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveJob,
    onMutate: async (jobId: string) => {
      await queryClient.cancelQueries({ queryKey: SAVED_JOBS_KEY });
      const previous = queryClient.getQueryData<SavedJob[]>(SAVED_JOBS_KEY);
      // Placeholder only — mutationFn only gives us the jobId, not the full SavedJob
      // shape. Safe because current consumers only read `.jobId` (membership) and
      // `.length`; onSettled's invalidate replaces this with the real row shortly after.
      queryClient.setQueryData<SavedJob[]>(SAVED_JOBS_KEY, (old) => [
        ...(old ?? []),
        { jobId } as SavedJob,
      ]);
      return { previous };
    },
    onError: (_err, _jobId, context) => {
      if (context?.previous) queryClient.setQueryData(SAVED_JOBS_KEY, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_JOBS_KEY });
    },
  });
};

export const useUnsaveJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unsaveJob,
    onMutate: async (jobId: string) => {
      await queryClient.cancelQueries({ queryKey: SAVED_JOBS_KEY });
      const previous = queryClient.getQueryData<SavedJob[]>(SAVED_JOBS_KEY);
      queryClient.setQueryData<SavedJob[]>(SAVED_JOBS_KEY, (old) =>
        (old ?? []).filter((s) => s.jobId !== jobId)
      );
      return { previous };
    },
    onError: (_err, _jobId, context) => {
      if (context?.previous) queryClient.setQueryData(SAVED_JOBS_KEY, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_JOBS_KEY });
    },
  });
};
