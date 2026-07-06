import { Layers } from "lucide-react";
import { formatSalary, JOB_TYPE_LABELS, PLAN_LABELS } from "@/features/admin/admin.utils";
import type { AdminJob } from "@/types/admin";

interface SubmissionSummaryProps {
  job: AdminJob;
}

export const SubmissionSummary = ({ job }: SubmissionSummaryProps) => {
  const facts = [
    { k: "Salary", v: `${formatSalary(job.salaryMin, job.salaryMax, job.currency)}/mo`, mono: true },
    { k: "Type", v: JOB_TYPE_LABELS[job.jobType] },
    { k: "Region", v: job.country ?? (job.isRemote ? "Remote" : "—") },
    { k: "Plan", v: PLAN_LABELS[job.planType] },
  ];

  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
        <Layers size={12} /> Submission summary
      </div>
      <div className="grid grid-cols-2 gap-2">
        {facts.map((f) => (
          <div className="flex items-center justify-between rounded-8 bg-neutral-50 px-3 py-2 text-[13px]" key={f.k}>
            <span className="text-neutral-500">{f.k}</span>
            <span className={`font-medium text-neutral-900 ${f.mono ? "font-mono" : ""}`}>{f.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
