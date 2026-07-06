import { useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Check, ChevronRight, Clock, Plus, ShieldCheck, Star, Users, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useEmployerApplicationsAggregate,
  useEmployerJobs,
  useEmployerProfile,
  useUpdateApplicationStatus,
} from "@/features/employer/employer.queries";
import {
  APPLICANT_STATUS,
  colorFor,
  NEXT_LABEL,
  NEXT_STAGE,
  STATUS_GROUP,
  STATUS_LABEL,
  timeAgo,
  type ApplicantStatusGroup,
} from "@/features/employer/employer-dashboard.utils";
import type { ApplicantWithJob } from "@/features/employer/employer.queries";
import type { ApplicationStatus } from "@/types/application";
import type { EmployerApplicant, EmployerJobListItem } from "@/types/employer";

interface KpiCardProps {
  label: string;
  icon: React.ElementType;
  value: string;
  sub: string;
}

const KpiCard = ({ label, icon: Icon, value, sub }: KpiCardProps) => (
  <div className="rounded-20 border border-neutral-100 bg-white p-5">
    <div className="mb-4 flex items-center justify-between">
      <p className="text-[12px] font-medium uppercase tracking-wider text-neutral-400">{label}</p>
      <span className="flex h-7 w-7 items-center justify-center rounded-8 bg-neutral-100">
        <Icon className="text-neutral-500" size={14} />
      </span>
    </div>
    <div className="flex items-end gap-2">
      <span className="text-[30px] font-semibold leading-none tracking-tight text-neutral-900">
        {value}
      </span>
    </div>
    <p className="mt-1 text-[12px] text-neutral-400">{sub}</p>
  </div>
);

const STATUS_MAP: Record<string, string> = {
  review: "bg-amber-50 text-amber-700 border-amber-200",
  live: "bg-brand-50 text-brand-700 border-brand-200",
  closed: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

interface ListingsPanelProps {
  jobs: EmployerJobListItem[];
  applicationsByJob: Map<string, EmployerApplicant[]>;
}

const ListingsPanel = ({ jobs, applicationsByJob }: ListingsPanelProps) => {
  const active = jobs.filter((j) => STATUS_GROUP[j.status] !== "closed").length;

  return (
    <div className="rounded-20 border border-neutral-100 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-neutral-900">
          Your listings <span className="font-normal text-neutral-400">· {active} active</span>
        </h3>
        <Link
          className="inline-flex items-center gap-1.5 rounded-10 bg-brand-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-700"
          to="/post-job"
        >
          <Plus size={11} /> Post a job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-neutral-400">
          No listings yet. Post your first job to start hiring.
        </p>
      ) : (
        <>
          <div className="mb-1 grid grid-cols-[1fr_80px_120px_60px_32px] gap-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            <span>Role</span>
            <span>Status</span>
            <span>Applications</span>
            <span>Views</span>
            <span />
          </div>

          <div className="divide-y divide-neutral-50">
            {jobs.map((j) => {
              const apps = applicationsByJob.get(j.id) ?? [];
              const total = j._count.applications;
              const reviewed = apps.filter((a) => a.status !== "PENDING").length;
              const shortlisted = apps.filter((a) => a.status === "SHORTLISTED").length;
              const newApps = apps.filter((a) => a.status === "PENDING").length;
              const reviewPct = total ? Math.round((reviewed / total) * 100) : 0;
              const shortPct = total ? Math.round((shortlisted / total) * 100) : 0;

              // The public job detail page only serves ACTIVE listings (drafts, pending
              // review, closed, and rejected jobs 404 there by design) — so only link an
              // employer's own row through when it's actually live; otherwise render the
              // same row without navigation instead of sending them to a broken page.
              const isPubliclyViewable = j.status === "ACTIVE";

              const rowContent = (
                <>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13.5px] font-medium text-neutral-900">
                        {j.title}
                      </span>
                      {j.planType === "FEATURED" && (
                        <span className="flex-shrink-0 rounded-full bg-brand-600 px-1.5 py-0.5 text-[9.5px] font-bold text-white">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11.5px] text-neutral-400">
                      <span>{timeAgo(j.publishedAt ?? j.createdAt)}</span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      STATUS_MAP[STATUS_GROUP[j.status]]
                    )}
                  >
                    {STATUS_LABEL[j.status]}
                  </span>

                  {total > 0 ? (
                    <div>
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-neutral-900">{total}</span>
                        {newApps > 0 && (
                          <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                            +{newApps} new
                          </span>
                        )}
                      </div>
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                        <span
                          className="absolute h-full rounded-full bg-amber-300"
                          style={{ width: `${reviewPct}%` }}
                        />
                        <span
                          className="absolute h-full rounded-full bg-brand-500"
                          style={{ width: `${shortPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[12px] italic text-neutral-400">Awaiting</span>
                  )}

                  <div className="text-center">
                    <div className="text-[13px] font-semibold text-neutral-700">{j.viewCount}</div>
                    <div className="text-[10px] text-neutral-400">views</div>
                  </div>

                  {isPubliclyViewable ? (
                    <ChevronRight className="text-neutral-300" size={14} />
                  ) : (
                    <span />
                  )}
                </>
              );

              if (isPubliclyViewable) {
                return (
                  <Link
                    className="grid cursor-pointer grid-cols-[1fr_80px_120px_60px_32px] items-center gap-3 rounded-12 px-2 py-3 transition-colors hover:bg-neutral-50"
                    key={j.id}
                    to={`/jobs/${j.id}`}
                  >
                    {rowContent}
                  </Link>
                );
              }

              return (
                <div
                  className="grid grid-cols-[1fr_80px_120px_60px_32px] items-center gap-3 rounded-12 px-2 py-3"
                  key={j.id}
                  title="This listing isn't live yet, so it doesn't have a public page to view."
                >
                  {rowContent}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

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

interface ApplicantsPanelProps {
  applicants: ApplicantWithJob[];
}

const ApplicantsPanel = ({ applicants }: ApplicantsPanelProps) => {
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

  const updateApplicantStatus = async (id: string, status: ApplicationStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast({
        variant: status === "REJECTED" ? "info" : "success",
        title: status === "REJECTED" ? "Applicant rejected" : "Applicant advanced",
      });
    } catch {
      toast({ variant: "error", title: "Couldn't update applicant" });
    }
  };

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
        <p className="py-8 text-center text-[13px] text-neutral-400">No applicants yet.</p>
      ) : (
        <div className="divide-y divide-neutral-50">
          {list.slice(0, RECENT_APPLICANTS_DISPLAY_COUNT).map((a) => {
            const name = a.talent.user.name ?? "Candidate";
            const initial = name.split(" ").slice(-1)[0]?.[0]?.toUpperCase() ?? "C";
            const group = APPLICANT_STATUS[a.status];
            const nextStatus = NEXT_STAGE[a.status];
            return (
              <div className="group flex items-center gap-3 rounded-12 px-2 py-3 transition-colors hover:bg-neutral-50" key={a.id}>
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
                      disabled={updateStatusMutation.isPending}
                      type="button"
                      onClick={() => updateApplicantStatus(a.id, nextStatus)}
                    >
                      <Check size={11} /> {NEXT_LABEL[a.status]}
                    </button>
                    <button
                      aria-label="Reject applicant"
                      className="grid h-7 w-7 place-items-center rounded-8 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      disabled={updateStatusMutation.isPending}
                      type="button"
                      onClick={() => updateApplicantStatus(a.id, "REJECTED")}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex-shrink-0 text-[11px] text-neutral-400">{timeAgo(a.appliedAt)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface CompanyCardProps {
  company: { companyName: string; isVerified: boolean; hqCountry: string | null };
}

const CompanyCard = ({ company }: CompanyCardProps) => (
  <div className="rounded-20 border border-neutral-100 bg-white p-5">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-12 bg-gradient-to-br from-brand-400 to-brand-700 text-[18px] font-bold text-white">
        {company.companyName.charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="text-[15px] font-semibold text-neutral-900">{company.companyName}</p>
        <div className="flex items-center gap-1.5 text-[12px] text-neutral-500">
          {company.isVerified && (
            <span className="inline-flex items-center gap-0.5 text-brand-700">
              <ShieldCheck size={11} /> Verified
            </span>
          )}
          {company.hqCountry && <span>· {company.hqCountry}</span>}
        </div>
      </div>
    </div>
  </div>
);

interface FunnelPanelProps {
  applicants: ApplicantWithJob[];
}

const MIN_FUNNEL_BAR_PCT = 6;

const FunnelPanel = ({ applicants }: FunnelPanelProps) => {
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

export const EmployerDashboard = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployerProfile();
  const { data: jobsData } = useEmployerJobs();
  const { applications, byJobId } = useEmployerApplicationsAggregate();

  const jobs = jobsData?.jobs ?? [];
  const stats = jobsData?.stats ?? { totalApps: 0, shortlisted: 0, avgTimeToHireInDays: 0 };
  const activeListings = jobs.filter((j) => j.status === "ACTIVE").length;
  const inReview = jobs.filter((j) => j.status === "PENDING_REVIEW").length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = (user?.name ?? "there").split(" ").slice(-1)[0] ?? user?.name ?? "there";

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <div className="mx-auto max-w-[1240px] px-6 py-8">
        {!profile && (
          <div className="mb-6 flex items-start gap-4 rounded-20 border border-amber-200 bg-amber-50 p-5">
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 text-[14.5px] font-semibold text-neutral-900">
                Set up your company profile
              </h3>
              <p className="text-[13px] text-neutral-600">
                Create your employer profile to post jobs and receive applications.
              </p>
            </div>
            <Link
              className="flex-shrink-0 rounded-10 bg-brand-600 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-brand-700"
              to="/post-job"
            >
              Get started
            </Link>
          </div>
        )}

        {/* Greeting */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-600" />
              Employer dashboard
            </div>
            <h1 className="mb-1 text-[32px] font-semibold tracking-tight text-neutral-900">
              {greeting}, <em className="font-serif italic text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>{firstName}.</em>
            </h1>
            <p className="text-[15px] text-neutral-500">
              You have <strong className="text-neutral-900">{stats.totalApps} applicants</strong> across{" "}
              <strong className="text-neutral-900">{activeListings}</strong> live{activeListings === 1 ? " role" : " roles"}.
            </p>
          </div>
          {profile && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-neutral-700">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-[10px] font-bold text-white">
                  {profile.companyName.charAt(0).toUpperCase()}
                </div>
                {profile.companyName}
                {profile.isVerified && (
                  <span className="flex items-center gap-0.5 text-brand-600">
                    <ShieldCheck size={11} /> Verified
                  </span>
                )}
              </div>
              <Link
                className="inline-flex items-center gap-1.5 rounded-12 bg-brand-600 px-4 py-2 text-[13.5px] font-medium text-white hover:bg-brand-700"
                to="/post-job"
              >
                <Plus size={13} /> Post a job
              </Link>
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard icon={Briefcase} label="Active listings" sub={`${inReview} in review`} value={String(activeListings)} />
          <KpiCard icon={Users} label="Total applications" sub="all listings" value={String(stats.totalApps)} />
          <KpiCard icon={Star} label="Shortlisted" sub="across roles" value={String(stats.shortlisted)} />
          <KpiCard
            icon={Clock}
            label="Avg. time to hire"
            sub="from apply to offer"
            value={stats.avgTimeToHireInDays ? `${stats.avgTimeToHireInDays}d` : "—"}
          />
        </div>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <ListingsPanel applicationsByJob={byJobId} jobs={jobs} />
            <ApplicantsPanel applicants={applications} />
          </div>

          <div className="space-y-4">
            {profile && <CompanyCard company={profile} />}
            <FunnelPanel applicants={applications} />
          </div>
        </div>
      </div>
    </div>
  );
};
