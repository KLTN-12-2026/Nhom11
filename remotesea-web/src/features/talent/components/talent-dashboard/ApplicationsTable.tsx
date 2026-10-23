import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { CompanyLogo } from "@/components/ui/company-logo";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/utils/cn";
import { companyColor, countryFlag } from "@/features/jobs/jobs.utils";
import { Pipeline } from "@/features/talent/components/talent-dashboard/Pipeline";
import { STAGE_LABEL, STATUS_TO_BUCKET, type AppStatusBucket } from "@/features/talent/talent-dashboard.utils";
import type { ApplicationWithJob } from "@/types/application";

const STATUS_MAP: Record<AppStatusBucket, { label: string; cls: string }> = {
  applied: { label: "Applied", cls: "bg-blue-50 text-blue-700 border border-blue-100" },
  review: { label: "In review", cls: "bg-amber-50 text-amber-700 border border-amber-100" },
  interview: { label: "Interviewing", cls: "bg-brand-50 text-brand-700 border border-brand-100" },
  offer: { label: "Offer", cls: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
  closed: { label: "Closed", cls: "bg-neutral-100 text-neutral-500" },
};

type TabId = "all" | "active" | "offers" | "closed";

interface ApplicationsTableProps {
  applications: ApplicationWithJob[];
}

export const ApplicationsTable = ({ applications }: ApplicationsTableProps) => {
  const [tab, setTab] = useState<TabId>("active");

  const inBucket = (a: ApplicationWithJob, buckets: AppStatusBucket[]) =>
    buckets.includes(STATUS_TO_BUCKET[a.status]);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "all", label: "All", count: applications.length },
    { id: "active", label: "Active", count: applications.filter((a) => inBucket(a, ["applied", "review", "interview"])).length },
    { id: "offers", label: "Offers", count: applications.filter((a) => inBucket(a, ["offer"])).length },
    { id: "closed", label: "Closed", count: applications.filter((a) => inBucket(a, ["closed"])).length },
  ];

  const filtered = applications.filter((a) => {
    if (tab === "all") return true;
    if (tab === "active") return inBucket(a, ["applied", "review", "interview"]);
    if (tab === "offers") return inBucket(a, ["offer"]);
    return inBucket(a, ["closed"]);
  });

  return (
    <div className="mb-5 overflow-hidden rounded-16 border border-neutral-100 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <h3 className="text-[14px] font-semibold text-neutral-900">
          Your applications{" "}
          <span className="font-normal text-neutral-400">
            · {applications.filter((a) => STATUS_TO_BUCKET[a.status] !== "closed").length} active
          </span>
        </h3>
        <div className="flex items-center gap-0.5 rounded-8 bg-neutral-100 p-0.5">
          {tabs.map((t) => (
            <button
              className={cn(
                "rounded-6 px-3 py-1 text-[12px] font-medium transition-all",
                tab === t.id ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              )}
              key={t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label} <span className="ml-0.5 text-neutral-400">{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      <Pipeline applications={applications} />

      {applications.length === 0 ? (
        <EmptyState
          className="px-5 py-10"
          description="Jobs you apply to will show up here."
          title="No applications yet"
        />
      ) : (
        <div>
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b border-neutral-50 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            <span>Role &amp; company</span>
            <span className="w-[100px] text-center">Status</span>
            <span className="hidden w-[140px] md:block">Stage</span>
            <span className="hidden w-[72px] text-right md:block">Applied</span>
            <span className="w-5" />
          </div>
          {filtered.map((a) => {
            const bucket = STATUS_TO_BUCKET[a.status];
            const s = STATUS_MAP[bucket];
            const company = a.job.employer.companyName;
            const country = a.job.country ?? "Remote";
            return (
              <Link
                className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b border-neutral-50 px-5 py-3.5 transition-colors last:border-none hover:bg-neutral-50/60"
                key={a.id}
                to={`/jobs/${a.jobId}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <CompanyLogo color={companyColor(company)} initial={company.charAt(0).toUpperCase()} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-neutral-900">{a.job.title}</p>
                    <p className="text-[12px] text-neutral-400">
                      {company} · {countryFlag(a.job.country)} {country}
                    </p>
                  </div>
                </div>
                <span className={cn("inline-flex w-[100px] items-center justify-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium", s.cls)}>
                  {s.label}
                </span>
                <span className="hidden w-[140px] text-[12px] text-neutral-500 md:block">
                  {STAGE_LABEL[a.status]}
                </span>
                <span className="hidden w-[72px] text-right text-[12px] text-neutral-400 md:block">
                  {new Date(a.appliedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                </span>
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-neutral-300" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
