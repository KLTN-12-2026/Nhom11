import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedJobs, useSaveJob, useUnsaveJob } from "@/features/saved/saved.queries";
import { ROUTES } from "@/constants/routes";

interface UseSavedJobToggleResult {
  saved: boolean;
  statusUnknown: boolean;
  toggle: (e?: React.MouseEvent) => Promise<void>;
}

// The original app computed the initial saved state server-side before first paint,
// so the button never rendered a wrong state. This is a client-only query instead, so
// while it's resolving for a signed-in user, callers show a neutral placeholder rather
// than defaulting to "unsaved" and flashing to "Saved" once it loads.
export const useSavedJobToggle = (jobId: string, loginCallbackUrl: string): UseSavedJobToggleResult => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: savedJobs, isLoading: savedStatusLoading } = useSavedJobs();
  const saveMutation = useSaveJob();
  const unsaveMutation = useUnsaveJob();

  const statusUnknown = !!user && savedStatusLoading;
  const saved = savedJobs?.some((s) => s.jobId === jobId) ?? false;

  const toggle = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!user) {
      navigate(`${ROUTES.login}?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`);
      return;
    }
    const prev = saved;
    try {
      if (prev) {
        await unsaveMutation.mutateAsync(jobId);
      } else {
        await saveMutation.mutateAsync(jobId);
      }
      toast({ variant: "success", title: prev ? "Removed from saved" : "Saved to your list" });
    } catch {
      toast({ variant: "error", title: "Couldn't update saved jobs" });
    }
  };

  return { saved, statusUnknown, toggle };
};
