import { Clock, FileText, MapPin, Monitor, Users } from "lucide-react";
import { JOB_TYPE_LABELS } from "@/features/jobs/jobs.utils";
import type { Job } from "@/types/job";

const DEFAULT_INTERVIEW_ROUNDS = "~3";

interface QuickFactsCardProps {
  job: Job;
}

export const QuickFactsCard = ({ job }: QuickFactsCardProps) => {
  const country = job.country ?? job.employer.hqCountry ?? "Remote";
  const timezone = job.timezone ?? (job.isRemote ? "Remote" : country);
  const hasEquipmentBenefit = job.benefits.some((b) => b.toLowerCase().includes("equipment"));

  const facts = [
    { icon: <MapPin size={13} />, k: "Visa needed", v: "No · remote" },
    { icon: <Clock size={13} />, k: "Timezone overlap", v: timezone },
    { icon: <FileText size={13} />, k: "Contract type", v: JOB_TYPE_LABELS[job.jobType] },
    { icon: <Monitor size={13} />, k: "Equipment", v: hasEquipmentBenefit ? "Provided" : "Self-supplied" },
    { icon: <Users size={13} />, k: "Interview rounds", v: DEFAULT_INTERVIEW_ROUNDS },
  ];

  return (
    <div className="rounded-16 border border-neutral-100 bg-white p-5">
      <h4 className="mb-3 text-[13px] font-semibold text-neutral-900">Quick facts</h4>
      <div className="space-y-2.5">
        {facts.map((r) => (
          <div className="flex items-center justify-between text-[13px]" key={r.k}>
            <span className="flex items-center gap-1.5 text-neutral-400">
              {r.icon} {r.k}
            </span>
            <span className="font-medium text-neutral-700">{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
