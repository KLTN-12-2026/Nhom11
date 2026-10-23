import { cn } from "@/utils/cn";
import type { ApplicantWithJob } from "@/features/employer/employer.queries";

interface FunnelPanelProps {
  applicants: ApplicantWithJob[];
}

const MIN_FUNNEL_BAR_PCT = 6;

export const FunnelPanel = ({ applicants }: FunnelPanelProps) => {
  const total = applicants.length;
  const countWhere = (pred: (a: ApplicantWithJob) => boolean) => applicants.filter(pred).length;
  // Exact per-stage counts, not cumulative — matches the original's countBy("SHORTLISTED")
  // etc. (a candidate currently INTERVIEW-ing is no longer counted as "Shortlisted").
  const reviewed = countWhere((a) => a.status !== "PENDING");
  const shortlisted = countWhere((a) => a.status === "SHORTLISTED");
  const interviewing = countWhere((a) => a.status === "INTERVIEW");
  const offers = countWhere((a) => a.status === "OFFERED");

  const funnel = [
    { label: "Applications", n: total, pct: 100, amber: false },
    { label: "Reviewed", n: reviewed, pct: total ? Math.round((reviewed / total) * 100) : 0, amber: false },
    { label: "Shortlisted", n: shortlisted, pct: total ? Math.round((shortlisted / total) * 100) : 0, amber: true },
    { label: "Interviewing", n: interviewing, pct: total ? Math.round((interviewing / total) * 100) : 0, amber: true },
    { label: "Offers", n: offers, pct: total ? Math.round((offers / total) * 100) : 0, amber: false },
  ];

  return (
    <div className="rounded-20 border border-neutral-100 bg-white p-5">
      <h3 className="mb-4 text-[14px] font-semibold text-neutral-900">
        Hiring funnel <span className="font-normal text-neutral-400">· all listings</span>
      </h3>
      <div className="space-y-2.5">
        {funnel.map((f) => (
          <div className="flex items-center gap-3" key={f.label}>
            <span className="w-24 flex-shrink-0 text-[12px] text-neutral-500">{f.label}</span>
            <div className="flex-1 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={cn("h-2 rounded-full transition-all", f.amber ? "bg-amber-400" : "bg-brand-500")}
                style={{ width: `${Math.max(f.pct, total ? MIN_FUNNEL_BAR_PCT : 0)}%` }}
              />
            </div>
            <span className="w-6 flex-shrink-0 text-right text-[12px] font-semibold text-neutral-700">{f.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
