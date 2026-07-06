import { Link } from "react-router-dom";
import { Briefcase, Clock, Plus, ShieldCheck, Star, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useEmployerApplicationsAggregate,
  useEmployerJobs,
  useEmployerProfile,
} from "@/features/employer/employer.queries";
import { KpiCard } from "@/features/employer/components/employer-dashboard/KpiCard";
import { ListingsPanel } from "@/features/employer/components/employer-dashboard/ListingsPanel";
import { ApplicantsPanel } from "@/features/employer/components/employer-dashboard/ApplicantsPanel";
import { CompanyCard } from "@/features/employer/components/employer-dashboard/CompanyCard";
import { FunnelPanel } from "@/features/employer/components/employer-dashboard/FunnelPanel";

const MORNING_END_HOUR = 12;
const AFTERNOON_END_HOUR = 18;

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
  const greeting = hour < MORNING_END_HOUR ? "Good morning" : hour < AFTERNOON_END_HOUR ? "Good afternoon" : "Good evening";
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
              {greeting}, <em className="font-serif-italic text-brand-700">{firstName}.</em>
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
