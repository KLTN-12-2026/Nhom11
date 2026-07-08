import { memo, useCallback, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useToast } from "@/components/ui/toast";
import { EmptyRow } from "@/components/shared/EmptyRow";
import { useUpdateApplicationStatus } from "@/features/employer/employer.queries";
import {
  APPLICANT_STATUS,
  colorFor,
  NEXT_LABEL,
  NEXT_STAGE,
  timeAgo,
  type ApplicantStatusGroup,
} from "@/features/employer/employer-dashboard.utils";
import type { ApplicantWithJob } from "@/features/employer/employer.queries";
import type { ApplicationStatus } from "@/types/application";

type ApplicantTabId = "all" | "new" | "shortlisted";

const RECENT_APPLICANTS_DISPLAY_COUNT = 8;

const APPLICANT_STATUS_CLASS: Record<ApplicantStatusGroup, string> = {
  new: "bg-blue-50 text-blue-700",
  reviewing: "bg-brand-50 text-brand-700",
  shortlisted: "bg-emerald-50 text-emerald-700",
  archived: "bg-neutral-100 text-neutral-500",
};

const APPLICANT_STATUS_LABEL: Record<ApplicantStatusGroup, string> = {
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  archived: "Archived",
};

interface ApplicantRowProps {
  applicant: ApplicantWithJob;
  isPending: boolean;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}

const ApplicantRow = memo(function ApplicantRow({ applicant: a, isPending, onStatusChange }: ApplicantRowProps) {
  const name = a.talent.user.name ?? "Candidate";
  const initial = name.split(" ").slice(-1)[0]?.[0]?.toUpperCase() ?? "C";
  const group = APPLICANT_STATUS[a.status];
  const nextStatus = NEXT_STAGE[a.status];
  return (
    <div className="group flex items-center gap-3 rounded-12 px-2 py-3 transition-colors hover:bg-neutral-50">
      <div
        className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
        style={{ background: colorFor(name) }}
      >
        {initial}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[13.5px] font-medium text-neutral-900">{name}</span>
        </div>
        <div className="text-[11.5px] text-neutral-400">
          {a.talent.headline ?? a.talent.level}
          <span className="text-neutral-300"> · for {a.jobTitle}</span>
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <div className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", APPLICANT_STATUS_CLASS[group])}>
          {APPLICANT_STATUS_LABEL[group]}
        </div>
      </div>

      {nextStatus && a.status !== "REJECTED" ? (
        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            className="inline-flex items-center gap-1 rounded-8 bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-50"
            disabled={isPending}
            type="button"
            onClick={() => onStatusChange(a.id, nextStatus)}
          >
            <Check size={11} /> {NEXT_LABEL[a.status]}
          </button>
          <button
            aria-label="Reject applicant"
            className="grid h-7 w-7 place-items-center rounded-8 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            disabled={isPending}
            type="button"
            onClick={() => onStatusChange(a.id, "REJECTED")}
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <div className="flex-shrink-0 text-[11px] text-neutral-400">{timeAgo(a.appliedAt)}</div>
      )}
    </div>
  );
});

interface ApplicantsPanelProps {
  applicants: ApplicantWithJob[];
}

export const ApplicantsPanel = ({ applicants }: ApplicantsPanelProps) => {
  const { toast } = useToast();
  const updateStatusMutation = useUpdateApplicationStatus();
  const [tab, setTab] = useState<ApplicantTabId>("all");

  const tabs: { id: ApplicantTabId; label: string; count: number }[] = [
    { id: "all", label: "All", count: applicants.length },
    { id: "new", label: "New", count: applicants.filter((a) => APPLICANT_STATUS[a.status] === "new").length },
    {
      id: "shortlisted",
      label: "Shortlisted",
      count: applicants.filter((a) => APPLICANT_STATUS[a.status] === "shortlisted").length,
    },
  ];
  const list = tab === "all" ? applicants : applicants.filter((a) => APPLICANT_STATUS[a.status] === tab);

  const { mutateAsync: updateStatus } = updateStatusMutation;
  const updateApplicantStatus = useCallback(
    async (id: string, status: ApplicationStatus) => {
      try {
        await updateStatus({ id, status });
        toast({
          variant: status === "REJECTED" ? "info" : "success",
          title: status === "REJECTED" ? "Applicant rejected" : "Applicant advanced",
        });
      } catch {
        toast({ variant: "error", title: "Couldn't update applicant" });
      }
    },
    [updateStatus, toast]
  );

  return (
    <div className="rounded-20 border border-neutral-100 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-neutral-900">Recent applicants</h3>
        <div className="flex gap-0.5 rounded-8 border border-neutral-200 bg-neutral-50 p-0.5">
          {tabs.map((t) => (
            <button
              className={cn(
                "rounded-6 px-2.5 py-1 text-[11.5px] font-medium transition-all",
                tab === t.id ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              )}
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
            >
              {t.label}
              <span
                className={cn(
                  "ml-1 rounded-full px-1 py-0.5 text-[10px]",
                  tab === t.id ? "bg-brand-100 text-brand-700" : "bg-neutral-100 text-neutral-400"
                )}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyRow>No applicants yet.</EmptyRow>
      ) : (
        <div className="divide-y divide-neutral-50">
          {list.slice(0, RECENT_APPLICANTS_DISPLAY_COUNT).map((a) => (
            <ApplicantRow
              applicant={a}
              isPending={updateStatusMutation.isPending}
              key={a.id}
              onStatusChange={updateApplicantStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};
