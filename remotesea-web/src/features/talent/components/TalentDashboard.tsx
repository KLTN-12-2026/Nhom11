import { Link } from "react-router-dom";
import { ArrowRight, Bookmark, Briefcase, Search, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyApplications } from "@/features/applications/applications.queries";
import { useMyTalentProfile } from "@/features/talent/talent.queries";
import { useSavedJobs } from "@/features/saved/saved.queries";
import { CompletionRing } from "@/features/talent/components/talent-dashboard/CompletionRing";
import { KpiCard } from "@/features/talent/components/talent-dashboard/KpiCard";
import { ApplicationsTable } from "@/features/talent/components/talent-dashboard/ApplicationsTable";
import { RecommendedJobs } from "@/features/talent/components/talent-dashboard/RecommendedJobs";
import { ProfileSnapshot } from "@/features/talent/components/talent-dashboard/ProfileSnapshot";
import {
  STATUS_TO_BUCKET,
  missingProfileFields,
  profileCompletion,
} from "@/features/talent/talent-dashboard.utils";
import { ROUTES } from "@/constants/routes";

const MORNING_END_HOUR = 12;
const AFTERNOON_END_HOUR = 18;

export const TalentDashboard = () => {
  const { user } = useAuth();
  const { data: applications = [] } = useMyApplications();
  const { data: profile } = useMyTalentProfile();
  const { data: savedJobs = [] } = useSavedJobs();

  const hour = new Date().getHours();
  const greeting = hour < MORNING_END_HOUR ? "Chào buổi sáng" : hour < AFTERNOON_END_HOUR ? "Chào buổi chiều" : "Chào buổi tối";
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
            {greeting}, <em className="font-serif-italic text-brand-700">{user?.name ?? "there"}</em>.
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
