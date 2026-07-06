import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Briefcase,
  ChevronRight,
  Clock,
  MapPin,
  Search,
  TrendingUp,
} from "lucide-react";
import { CompanyLogo } from "@/components/ui/company-logo";
import { SalaryBadge } from "@/components/ui/salary-badge";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/utils/cn";
import { useAuth } from "@/contexts/AuthContext";
import { useMyApplications } from "@/features/applications/applications.queries";
import { useMyTalentProfile } from "@/features/talent/talent.queries";
import { useSavedJobs } from "@/features/saved/saved.queries";
import { useJobsQuery } from "@/features/jobs/jobs.queries";
import { DEFAULT_FILTERS } from "@/features/jobs/job-filters";
import { companyColor, countryFlag } from "@/features/jobs/jobs.utils";
import {
  STAGE_LABEL,
  STATUS_TO_BUCKET,
  missingProfileFields,
  profileCompletion,
  type AppStatusBucket,
} from "@/features/talent/talent-dashboard.utils";
import { ROUTES } from "@/constants/routes";
import type { ApplicationWithJob } from "@/types/application";

const STATUS_MAP: Record<AppStatusBucket, { label: string; cls: string }> = {
  applied: { label: "Applied", cls: "bg-blue-50 text-blue-700 border border-blue-100" },
  review: { label: "In review", cls: "bg-amber-50 text-amber-700 border border-amber-100" },
  interview: { label: "Interviewing", cls: "bg-brand-50 text-brand-700 border border-brand-100" },
  offer: { label: "Offer", cls: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
  closed: { label: "Closed", cls: "bg-neutral-100 text-neutral-500" },
};

type TabId = "all" | "active" | "offers" | "closed";

const RECOMMENDED_JOBS_LIMIT = 20;
const RECOMMENDED_JOBS_DISPLAY_COUNT = 3;

interface CompletionRingProps {
  pct: number;
}

const CompletionRing = ({ pct }: CompletionRingProps) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * pct) / 100;
  return (
    <div className="relative flex-shrink-0">
      <svg height="58" viewBox="0 0 58 58" width="58">
        <circle className="stroke-neutral-100" cx="29" cy="29" fill="none" r={radius} strokeWidth="5" />
        <circle
          className="stroke-brand-600"
          cx="29"
          cy="29"
          fill="none"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="5"
          style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-mono text-[13px] font-semibold text-neutral-900">
        {pct}%
      </div>
    </div>
  );
};

interface KpiCardProps {
  label: string;
  icon: React.ElementType;
  value: string;
  sub: string;
}

const KpiCard = ({ label, icon: Icon, value, sub }: KpiCardProps) => (
  <div className="rounded-16 border border-neutral-100 bg-white p-5">
    <div className="mb-3 flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">{label}</span>
      <Icon className="text-neutral-300" size={13} />
    </div>
    <div className="mb-1 text-[28px] font-semibold tracking-tight text-neutral-900">{value}</div>
    <span className="text-[12px] text-neutral-400">{sub}</span>
  </div>
);

interface PipelineProps {
  applications: ApplicationWithJob[];
}

const Pipeline = ({ applications }: PipelineProps) => {
  const countByBucket = (bucket: AppStatusBucket) =>
    applications.filter((a) => STATUS_TO_BUCKET[a.status] === bucket).length;
  const stages: { label: string; n: number; active?: boolean }[] = [
    { label: "Applied", n: countByBucket("applied") },
    { label: "In review", n: countByBucket("review") },
    { label: "Interviewing", n: countByBucket("interview"), active: true },
    { label: "Offers", n: countByBucket("offer") },
    { label: "Closed", n: countByBucket("closed") },
  ];
  return (
    <div className="flex border-b border-neutral-100 bg-neutral-50/50">
      {stages.map((s, i) => (
        <div
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 px-2 py-3 text-center",
            i < stages.length - 1 && "border-r border-neutral-100",
            s.active && "border-b-2 border-brand-600 bg-white"
          )}
          key={s.label}
        >
          <span
            className={cn(
              "font-mono text-[20px] font-semibold leading-none tracking-tight",
              s.active ? "text-brand-700" : "text-neutral-900"
            )}
          >
            {s.n.toString().padStart(2, "0")}
          </span>
          <span className={cn("text-[11px]", s.active ? "font-medium text-brand-600" : "text-neutral-400")}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
};

interface ApplicationsTableProps {
  applications: ApplicationWithJob[];
}

const ApplicationsTable = ({ applications }: ApplicationsTableProps) => {
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
        <div className="px-5 py-10 text-center text-neutral-500">
          <p className="mb-1 font-medium text-neutral-900">No applications yet</p>
          <p className="text-sm">Jobs you apply to will show up here.</p>
        </div>
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

interface RecommendedJobsProps {
  applications: ApplicationWithJob[];
}

const RecommendedJobs = ({ applications }: RecommendedJobsProps) => {
  const { data } = useJobsQuery(DEFAULT_FILTERS, RECOMMENDED_JOBS_LIMIT);
  const appliedIds = new Set(applications.map((a) => a.jobId));
  const recommended = (data?.jobs ?? [])
    .filter((j) => !appliedIds.has(j.id))
    .slice(0, RECOMMENDED_JOBS_DISPLAY_COUNT);

  if (recommended.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-16 border border-neutral-100 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <h3 className="text-[14px] font-semibold text-neutral-900">
          Picked for you <span className="font-normal text-neutral-400">· newest &amp; featured</span>
        </h3>
        <Link className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 hover:text-brand-700" to={ROUTES.jobs}>
          Browse all jobs <ArrowRight size={12} />
        </Link>
      </div>
      <div>
        {recommended.map((job) => {
          const why = job.skills.slice(0, 2).map((s) => s.skill.name).join(" + ") || "Matches your profile";
          const country = job.country ?? "Remote";
          return (
            <Link
              className="flex items-center gap-4 border-b border-neutral-50 px-5 py-4 transition-colors last:border-none hover:bg-neutral-50/60"
              key={job.id}
              to={`/jobs/${job.id}`}
            >
              <CompanyLogo color={companyColor(job.employer.companyName)} initial={job.employer.companyName.charAt(0).toUpperCase()} size={40} />
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-1.5 text-[11.5px] text-neutral-400">
                  <span>{job.employer.companyName}</span>
                  <span className="h-1 w-1 rounded-full bg-neutral-300" />
                  <span>{countryFlag(job.country)} {country}</span>
                </div>
                <p className="mb-1 text-[13.5px] font-medium text-neutral-900">{job.title}</p>
                <div className="flex flex-wrap gap-1">
                  {job.skills.slice(0, 3).map(({ skill }) => (
                    <Tag key={skill.id}>{skill.name}</Tag>
                  ))}
                </div>
              </div>
              <div className="hidden flex-shrink-0 flex-col items-end gap-1.5 md:flex">
                <span className="text-right text-[11px] text-neutral-400">{why}</span>
              </div>
              <SalaryBadge max={job.salaryMax ?? 0} min={job.salaryMin ?? 0} />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const ProfileSnapshot = () => {
  const { user } = useAuth();
  const { data: profile } = useMyTalentProfile();

  return (
    <div className="mb-5 overflow-hidden rounded-16 border border-neutral-100 bg-white shadow-card">
      <div className="flex flex-col items-center p-5 text-center">
        <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-lg font-semibold text-white">
          {(user?.name ?? "?").charAt(0).toUpperCase()}
        </div>
        <h3 className="text-[15px] font-semibold text-neutral-900">{user?.name}</h3>
        <p className="mt-0.5 text-[12.5px] text-neutral-400">
          {profile?.headline || "No headline yet"}
        </p>
        <Link
          className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-8 border border-neutral-200 text-[12.5px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          to={ROUTES.profile}
        >
          Edit profile <ArrowRight size={12} />
        </Link>
      </div>
      <div className="border-t border-neutral-100">
        {[
          { icon: MapPin, label: "Based in", value: profile?.location || "—" },
          { icon: Clock, label: "Timezone", value: profile?.timezone || "—" },
          {
            icon: Briefcase,
            label: "Expecting",
            value:
              profile?.desiredSalaryMin && profile.desiredSalaryMax
                ? `$${profile.desiredSalaryMin.toLocaleString()}–${profile.desiredSalaryMax.toLocaleString()}/mo`
                : "—",
          },
        ].map(({ icon: Icon, label, value }) => (
          <div className="flex items-center justify-between border-b border-neutral-50 px-4 py-2.5 last:border-none" key={label}>
            <span className="flex items-center gap-1.5 text-[12px] text-neutral-400">
              <Icon size={12} /> {label}
            </span>
            <span className="text-[12px] font-medium text-neutral-700">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TalentDashboard = () => {
  const { user } = useAuth();
  const { data: applications = [] } = useMyApplications();
  const { data: profile } = useMyTalentProfile();
  const { data: savedJobs = [] } = useSavedJobs();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  const interviewing = applications.filter((a) => STATUS_TO_BUCKET[a.status] === "interview").length;
  const offers = applications.filter((a) => STATUS_TO_BUCKET[a.status] === "offer").length;
  const completion = profileCompletion(profile);
  const missing = missingProfileFields(profile);
  const interviewRate =
    applications.length > 0 ? Math.round(((interviewing + offers) / applications.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-10">
      {/* Greeting */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-600" />
            Dashboard
          </div>
          <h1 className="mb-1 text-[32px] font-semibold tracking-tight text-neutral-900">
            {greeting}, <em className="font-serif italic text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>{user?.name ?? "there"}</em>.
          </h1>
          <p className="text-[14px] text-neutral-500">
            You have <strong className="font-semibold text-neutral-800">{interviewing} {interviewing === 1 ? "interview" : "interviews"} in progress</strong> and {offers} {offers === 1 ? "offer" : "offers"} on the table.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center gap-2 rounded-12 bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          to={ROUTES.jobs}
        >
          <Search size={14} /> Browse jobs
        </Link>
      </div>

      {/* Profile completion banner */}
      {completion < 100 && (
        <div className="mb-6 flex flex-col items-start gap-4 rounded-16 border border-brand-100 bg-brand-50/60 p-5 sm:flex-row sm:items-center">
          <CompletionRing pct={completion} />
          <div className="flex-1">
            <h3 className="mb-0.5 text-[14px] font-semibold text-neutral-900">
              Your profile is <em className="italic text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>{completion}% complete</em>
            </h3>
            <p className="text-[13px] text-neutral-500">
              {missing.length > 0
                ? <>Add {missing.map((m, i) => <strong className="text-neutral-700" key={m}>{i > 0 ? ", " : ""}{m}</strong>)} to show up in more searches.</>
                : "Nice — your profile is in good shape."}
            </p>
          </div>
          <Link
            className="inline-flex h-10 flex-shrink-0 items-center gap-2 rounded-12 bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            to={ROUTES.profile}
          >
            Complete profile <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* KPI tiles */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard icon={Briefcase} label="Applications sent" sub="all time" value={String(applications.length)} />
        <KpiCard icon={Bookmark} label="Saved jobs" sub="current" value={String(savedJobs.length)} />
        <KpiCard icon={TrendingUp} label="Interview rate" sub="of submitted" value={`${interviewRate}%`} />
      </div>

      {/* Main two-column grid */}
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div>
          <ApplicationsTable applications={applications} />
          <RecommendedJobs applications={applications} />
        </div>
        <div>
          <ProfileSnapshot />
        </div>
      </div>
    </div>
  );
};
