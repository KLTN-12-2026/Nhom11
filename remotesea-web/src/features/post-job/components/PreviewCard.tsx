import { Clock, Globe, MapPin } from "lucide-react";
import { companyColor } from "@/features/jobs/jobs.utils";
import type { PostJobFormState } from "@/features/post-job/post-job.schemas";

interface PreviewCardProps {
  form: PostJobFormState;
}

const PREVIEW_SKILLS_DISPLAY_COUNT = 4;

export const PreviewCard = ({ form }: PreviewCardProps) => {
  const color = companyColor(form.coName || "Your Company");

  return (
    <div className="rounded-16 border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-start gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-12 text-[14px] font-bold text-white"
          style={{ background: color }}
        >
          {form.coName ? form.coName[0]?.toUpperCase() : "A"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold text-neutral-900">
            {form.jobTitle || "Senior Frontend Engineer"}
          </p>
          <p className="truncate text-[12px] text-neutral-500">
            {form.coName || "Your Company"} · {form.coHq}
          </p>
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {[
          { icon: MapPin, label: form.jobLoc },
          { icon: Globe, label: form.jobSeniority },
          { icon: Clock, label: form.jobTz.split("·")[0].trim() },
        ].map(({ icon: Icon, label }) => (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500"
            key={label}
          >
            <Icon size={9} />
            {label}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {form.jobSkills.slice(0, PREVIEW_SKILLS_DISPLAY_COUNT).map((s) => (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-medium text-brand-700" key={s}>
            {s}
          </span>
        ))}
        {form.jobSkills.length > PREVIEW_SKILLS_DISPLAY_COUNT && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10.5px] text-neutral-400">
            +{form.jobSkills.length - PREVIEW_SKILLS_DISPLAY_COUNT}
          </span>
        )}
      </div>
      <div className="mt-3 border-t border-neutral-50 pt-3 text-[12px]">
        <span className="font-semibold text-neutral-900">
          ${form.salMin.toLocaleString()}–${form.salMax.toLocaleString()}
        </span>
        <span className="text-neutral-400">
          {" "}
          {form.salCur} {form.salPer}
        </span>
      </div>
    </div>
  );
};
