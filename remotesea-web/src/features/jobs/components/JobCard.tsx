import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, Clock, RefreshCw, ShieldCheck, Star } from "lucide-react";
import { CompanyLogo } from "@/components/ui/company-logo";
import { Badge } from "@/components/ui/badge";
import { SalaryBadge } from "@/components/ui/salary-badge";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/utils/cn";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedJobs, useToggleSavedJob } from "@/features/saved/saved.queries";
import {
  JOB_TYPE_LABELS,
  LEVEL_LABELS,
  companyColor,
  countryFlag,
  isAsyncTimezone,
  timeAgo,
} from "@/features/jobs/jobs.utils";
import { ROUTES } from "@/constants/routes";
import type { Job } from "@/types/job";

export function JobCard({ job }: { job: Job }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: savedJobs, isLoading: savedStatusLoading } = useSavedJobs();
  const toggleSaved = useToggleSavedJob();
  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null);

  // Avoid flashing "unsaved" before the saved-jobs query resolves for a signed-in
  // user — the original computed this server-side before first paint.
  const statusUnknown = !!user && savedStatusLoading;
  const savedFromServer = savedJobs?.some((s) => s.jobId === job.id) ?? false;
  const saved = optimisticSaved ?? savedFromServer;

  const country = job.country ?? "Remote";
  const timezone = job.timezone ?? (job.isRemote ? "Remote" : country);
  const isAsync = isAsyncTimezone(timezone);
  const category = job.categories[0]?.category.name ?? "Other";

  async function handleToggleSave(e: React.MouseEvent) {
    e.preventDefault();
    if (!user) {
      navigate(`${ROUTES.login}?callbackUrl=${encodeURIComponent(ROUTES.jobs)}`);
      return;
    }
    const prev = saved;
    setOptimisticSaved(!prev);
    try {
      await toggleSaved.mutateAsync(job.id);
      toast({ variant: "success", title: prev ? "Removed from saved" : "Saved to your list" });
    } catch {
      setOptimisticSaved(prev);
      toast({ variant: "error", title: "Couldn't update saved jobs" });
    }
  }

  return (
    <Link
      className={cn(
        "group flex items-start gap-4 rounded-12 border border-neutral-100 bg-white p-5 transition-all duration-150 hover:border-neutral-200 hover:shadow-card",
        job.isFeatured && "border-l-2 border-l-amber-400"
      )}
      to={`/jobs/${job.id}`}
    >
      <CompanyLogo
        color={companyColor(job.employer.companyName)}
        initial={job.employer.companyName.charAt(0).toUpperCase()}
        size={44}
      />

      <div className="min-w-0 flex-1">
        {/* Row 1 — company + badges */}
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          {job.employer.isVerified && (
            <Badge variant="verified">
              <ShieldCheck size={10} />
              Verified
            </Badge>
          )}
          <span className="text-[13px] font-medium text-neutral-600">{job.employer.companyName}</span>
          <span className="text-[13px] text-neutral-400">
            {countryFlag(job.country)} {country}
          </span>
          {job.isFeatured && (
            <Badge variant="featured">
              <Star size={10} />
              Featured
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-2 text-[15px] font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-brand-700">
          {job.title}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag>{category}</Tag>
          <Tag>{LEVEL_LABELS[job.level]}</Tag>
          <Tag>{JOB_TYPE_LABELS[job.jobType]}</Tag>
          <Tag>
            {isAsync ? <RefreshCw size={11} /> : <Clock size={11} />}
            {timezone}
          </Tag>
          {job.vnHireCount > 0 && <Badge variant="vn">🇻🇳 {job.vnHireCount} VN here</Badge>}
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-shrink-0 flex-col items-end gap-2">
        <SalaryBadge max={job.salaryMax ?? 0} min={job.salaryMin ?? 0} />
        <span className="text-[12px] text-neutral-400">
          {timeAgo(job.publishedAt ?? job.createdAt)} ago
        </span>
        <button
          aria-label={saved ? "Unsave job" : "Save job"}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-8 transition-colors",
            statusUnknown
              ? "text-transparent"
              : saved
                ? "text-brand-600"
                : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          )}
          disabled={statusUnknown}
          onClick={handleToggleSave}
        >
          <Bookmark fill={saved ? "currentColor" : "none"} size={15} />
        </button>
      </div>
    </Link>
  );
}
