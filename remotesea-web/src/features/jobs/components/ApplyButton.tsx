import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { useApplyToJob } from "@/features/applications/applications.queries";
import { ApiError } from "@/services/api-error";
import { ROUTES } from "@/constants/routes";

export function ApplyButton({ jobId }: { jobId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const applyToJob = useApplyToJob();
  const [state, setState] = useState<"idle" | "applied" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleApply() {
    if (!user) {
      navigate(`${ROUTES.login}?callbackUrl=${encodeURIComponent(`/jobs/${jobId}`)}`);
      return;
    }

    setMessage(null);
    try {
      await applyToJob.mutateAsync({ jobId });
      setState("applied");
      toast({ variant: "success", title: "Application sent", description: "The employer has been notified." });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setState("applied");
        setMessage("You already applied to this role.");
        toast({ variant: "info", title: "Already applied" });
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        setMessage("Create a talent profile first.");
        setState("error");
        toast({ variant: "info", title: "Finish your profile first" });
        navigate(ROUTES.profile);
        return;
      }
      setState("error");
      setMessage("Something went wrong. Please try again.");
      toast({ variant: "error", title: "Couldn't submit application", description: "Please try again." });
    }
  }

  if (state === "applied") {
    return (
      <div className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-12 border border-brand-200 bg-brand-50 py-3 text-[15px] font-medium text-brand-700">
        <Check size={16} /> Application sent
      </div>
    );
  }

  return (
    <>
      <button
        className="mb-2.5 w-full rounded-12 bg-brand-600 py-3 text-[15px] font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        disabled={applyToJob.isPending}
        type="button"
        onClick={handleApply}
      >
        {applyToJob.isPending ? "Applying…" : "Apply now →"}
      </button>
      {message && <p className="mb-2.5 text-center text-[12px] text-red-600">{message}</p>}
    </>
  );
}
