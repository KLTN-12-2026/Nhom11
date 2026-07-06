import { Bookmark } from "lucide-react";
import { cn } from "@/utils/cn";
import { useSavedJobToggle } from "@/features/jobs/useSavedJobToggle";

interface SaveJobButtonProps {
  jobId: string;
}

export const SaveJobButton = ({ jobId }: SaveJobButtonProps) => {
  const { saved, statusUnknown, toggle } = useSavedJobToggle(jobId, `/jobs/${jobId}`);

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
      onClick={() => toggle()}
    >
      <Bookmark className={statusUnknown ? "text-transparent" : undefined} fill={saved ? "currentColor" : "none"} size={15} />
      {saved ? "Saved" : "Save for later"}
    </button>
  );
};
