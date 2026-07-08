import { memo } from "react";
import { Clock } from "lucide-react";
import { CompanyInitial } from "@/features/admin/components/CompanyInitial";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { hoursSince, waitCls, waitFmt } from "@/features/admin/admin.utils";
import type { AdminJob } from "@/types/admin";

interface QueueListPaneProps {
  jobs: AdminJob[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

interface QueueListRowProps {
  job: AdminJob;
  selected: boolean;
  onSelect: (id: string) => void;
}

const QueueListRow = memo(function QueueListRow({ job: j, selected, onSelect }: QueueListRowProps) {
  return (
    <button
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${selected ? "bg-brand-50" : ""}`}
      onClick={() => onSelect(j.id)}
    >
      <CompanyInitial name={j.employer.companyName} size={34} />
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-neutral-700">{j.employer.companyName}</div>
        <div className="truncate text-[13px] font-medium text-neutral-900">{j.title}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          <span className={`font-mono text-[11px] ${waitCls(hoursSince(j.createdAt))}`}>
            {waitFmt(hoursSince(j.createdAt))}
          </span>
          {j.planType === "FEATURED" && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              Featured
            </span>
          )}
          {!j.employer.isVerified && <VerifiedBadge isVerified={false} label="Unverified employer" />}
        </div>
      </div>
    </button>
  );
});

export const QueueListPane = ({ jobs, selectedId, onSelect }: QueueListPaneProps) => (
  <div className="rounded-12 border border-neutral-100 bg-white">
    <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
      <span className="text-[13px] font-semibold text-neutral-900">
        Pending{" "}
        <span className="ml-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px]">{jobs.length}</span>
      </span>
      <span className="flex items-center gap-1 text-[11px] text-neutral-400">
        <Clock size={12} /> Oldest first
      </span>
    </div>
    <div className="divide-y divide-neutral-50">
      {jobs.map((j) => (
        <QueueListRow job={j} key={j.id} onSelect={onSelect} selected={j.id === selectedId} />
      ))}
    </div>
  </div>
);
