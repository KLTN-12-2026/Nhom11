import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { cn } from "@/utils/cn";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedJobs, useToggleSavedJob } from "@/features/saved/saved.queries";
import { ROUTES } from "@/constants/routes";

export function SaveJobButton({ jobId }: { jobId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: savedJobs, isLoading: savedStatusLoading } = useSavedJobs();
  const toggleSaved = useToggleSavedJob();
  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null);

  // The original app computed initialSaved server-side before first paint, so the
  // button never rendered a wrong state. This is a client-only query instead, so
  // while it's resolving for a signed-in user, show a neutral placeholder rather
  // than defaulting to "unsaved" and flashing to "Saved" once it loads.
  const statusUnknown = !!user && savedStatusLoading;
  const savedFromServer = savedJobs?.some((s) => s.jobId === jobId) ?? false;
  const saved = optimisticSaved ?? savedFromServer;

  async function toggle() {
    if (!user) {
      navigate(`${ROUTES.login}?callbackUrl=${encodeURIComponent(`/jobs/${jobId}`)}`);
      return;
    }
    const prev = saved;
    setOptimisticSaved(!prev);
    try {
      await toggleSaved.mutateAsync(jobId);
      toast({ variant: "success", title: prev ? "Removed from saved" : "Saved to your list" });
    } catch {
      setOptimisticSaved(prev);
      toast({ variant: "error", title: "Couldn't update saved jobs" });
    }
  }

  return (
    <button
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-12 border py-2.5 text-[14px] font-medium transition-colors",
        statusUnknown
          ? "border-neutral-100 bg-neutral-50 text-transparent"
          : saved
            ? "border-brand-200 bg-brand-50 text-brand-700"
            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
      )}
      disabled={statusUnknown}
      type="button"
      onClick={toggle}
    >
      <Bookmark className={statusUnknown ? "text-transparent" : undefined} fill={saved ? "currentColor" : "none"} size={15} />
      {saved ? "Saved" : "Save for later"}
    </button>
  );
}
