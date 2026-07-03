import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, FileText, MapPin, Monitor, ShieldCheck, Users } from "lucide-react";
import { CompanyLogo } from "@/components/ui/company-logo";
import { Badge } from "@/components/ui/badge";
import { SalaryBadge } from "@/components/ui/salary-badge";
import { Tag } from "@/components/ui/tag";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ApplyButton } from "@/features/jobs/components/ApplyButton";
import { SaveJobButton } from "@/features/jobs/components/SaveJobButton";
import { useJobQuery } from "@/features/jobs/jobs.queries";
import { useSalaryBenchmarks } from "@/features/salary/salary.queries";
import {
  JOB_TYPE_LABELS,
  LEVEL_LABELS,
  companyColor,
  countryFlag,
  timeAgo,
} from "@/features/jobs/jobs.utils";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/constants/routes";

function daysUntil(dateString: string | null): number | null {
  if (!dateString) return null;
  const diff = new Date(dateString).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, isError } = useJobQuery(id);
  const { data: benchmarks } = useSalaryBenchmarks();
  useDocumentTitle(job ? `${job.title} at ${job.employer.companyName}` : "Job");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1240px] px-6 py-10">
        <Skeleton className="mb-8 h-4 w-24" />
        <Skeleton className="h-40 w-full rounded-16" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Job not found</h1>
        <p className="mt-2 text-sm text-neutral-500">
          This listing may have closed or the link is incorrect.
        </p>
        <Link className="mt-6" to={ROUTES.jobs}>
          <Button variant="primary">Back to jobs</Button>
        </Link>
      </div>
    );
  }

  const country = job.country ?? job.employer.hqCountry ?? "Remote";
  const timezone = job.timezone ?? (job.isRemote ? "Remote" : country);
  const category = job.categories[0]?.category.name ?? "Other";
  const color = companyColor(job.employer.companyName);
  const initial = job.employer.companyName.charAt(0).toUpperCase();
  const expiresInDays = daysUntil(job.expiresAt);

  // Salary benchmark (aggregated from live listings) — ported from app/jobs/[id]/page.tsx
  const salaryMin = job.salaryMin ?? 0;
  const salaryMax = job.salaryMax ?? 0;
  const bench = benchmarks?.find((b) => b.role === category) ??
    benchmarks?.[0] ?? {
      role: category,
      min: salaryMin,
      mid: Math.round((salaryMin + salaryMax) / 2),
      max: salaryMax,
      count: 1,
    };
  const jobMid = (salaryMin + salaryMax) / 2;
  const benchRange = bench.max - bench.min;
  const benchPos = benchRange ? ((jobMid - bench.min) / benchRange) * 100 : 50;
  const percentile = Math.max(5, Math.min(95, Math.round(benchPos)));

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-10">
      <Link
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        to={ROUTES.jobs}
      >
        <ArrowLeft size={14} /> Back to jobs
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div>
          {/* Header */}
          <div className="mb-6 flex items-start gap-4 rounded-16 border border-neutral-100 bg-white p-6 shadow-card">
            <CompanyLogo color={color} initial={initial} size={56} />
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2 text-sm text-neutral-400">
                {job.employer.isVerified && (
                  <span className="inline-flex items-center gap-1 text-brand-600">
                    <ShieldCheck size={13} /> Verified employer
                  </span>
                )}
                {job.employer.isVerified && <span>·</span>}
                <span>
                  {countryFlag(job.country)} {country}
                </span>
              </div>
              <h1 className="mb-1 text-[22px] font-semibold text-neutral-900">{job.title}</h1>
              <p className="text-[15px] text-neutral-500">{job.employer.companyName}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {job.isFeatured && <Badge variant="featured">⭐ Featured</Badge>}
                <Tag>{category}</Tag>
                <Tag>{LEVEL_LABELS[job.level]}</Tag>
                <Tag>{JOB_TYPE_LABELS[job.jobType]}</Tag>
                <Tag>{timezone}</Tag>
                {job.vnHireCount > 0 && (
                  <Badge variant="vn">
                    <Users size={10} /> {job.vnHireCount} VN on team
                  </Badge>
                )}
              </div>
            </div>
            <div className="hidden flex-col items-end gap-2 sm:flex">
              <SalaryBadge max={job.salaryMax ?? 0} min={job.salaryMin ?? 0} />
              <span className="inline-flex items-center gap-1 text-[12px] text-neutral-400">
                <Clock size={11} /> Posted {timeAgo(job.publishedAt ?? job.createdAt)} ago
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6 rounded-16 border border-neutral-100 bg-white p-6 shadow-card">
            <h2 className="mb-3 text-[15px] font-semibold text-neutral-900">About the role</h2>
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-neutral-600">
              {job.description}
            </p>
          </div>

          {/* Skills */}
          {job.skills.length > 0 && (
            <div className="mb-6 rounded-16 border border-neutral-100 bg-white p-6 shadow-card">
              <h2 className="mb-3 text-[15px] font-semibold text-neutral-900">
                Skills &amp; technologies
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map(({ skill }) => (
                  <Tag key={skill.id}>{skill.name}</Tag>
                ))}
              </div>
            </div>
          )}

          {/* Benefits */}
          {job.benefits.length > 0 && (
            <div className="rounded-16 border border-neutral-100 bg-white p-6 shadow-card">
              <h2 className="mb-3 text-[15px] font-semibold text-neutral-900">Benefits</h2>
              <ul className="space-y-2">
                {job.benefits.map((b) => (
                  <li className="flex items-center gap-2 text-[14px] text-neutral-600" key={b}>
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-600" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="sticky top-6 space-y-4">
            {/* Apply card */}
            <div className="rounded-16 border border-brand-100 bg-brand-50 p-6">
              <div className="mb-1 font-mono text-[22px] font-semibold text-neutral-900">
                ${(job.salaryMin ?? 0).toLocaleString()}–{(job.salaryMax ?? 0).toLocaleString()}
                <span className="text-[14px] font-normal text-neutral-500"> /mo</span>
              </div>
              <p className="mb-5 text-[12px] text-neutral-400">
                {job.currency} · paid via {country === "US" ? "Deel or Wise" : "Wise or local TT"}
              </p>
              <ApplyButton jobId={job.id} />
              <SaveJobButton jobId={job.id} />
              <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-neutral-400">Posted</span>
                  <span className="font-medium text-neutral-700">
                    {timeAgo(job.publishedAt ?? job.createdAt)} ago
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-neutral-400">Applicants so far</span>
                  <span className="font-medium text-neutral-700">{job.applyCount}</span>
                </div>
                {expiresInDays !== null && (
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-neutral-400">Expires in</span>
                    <span className="font-medium text-neutral-700">{expiresInDays} days</span>
                  </div>
                )}
              </div>
            </div>

            {/* VN signal */}
            {job.vnHireCount > 0 && (
              <div className="flex gap-3 rounded-16 border border-neutral-100 bg-white p-5">
                <span className="text-[28px]">🇻🇳</span>
                <div>
                  <h5 className="mb-1 text-[13px] font-semibold text-neutral-900">
                    {job.vnHireCount} Vietnamese already work at {job.employer.companyName}
                  </h5>
                  <p className="text-[12px] leading-relaxed text-neutral-500">
                    You can connect with them through your application — they&apos;re often happy to
                    refer or share what the team&apos;s actually like.
                  </p>
                </div>
              </div>
            )}

            {/* Salary benchmark */}
            <div className="rounded-16 border border-neutral-100 bg-white p-5">
              <h4 className="mb-4 text-[13px] font-semibold text-neutral-900">
                Salary check · {bench.role}
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="text-neutral-500">This role</span>
                    <span className="font-mono font-semibold text-neutral-900">
                      ${jobMid.toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{ width: `${Math.max(4, benchPos)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="text-neutral-500">Market range</span>
                    <span className="font-mono text-neutral-500">
                      ${bench.min.toLocaleString()}–${bench.max.toLocaleString()}
                    </span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div className="absolute h-full w-full rounded-full bg-neutral-200" />
                    <div
                      className="absolute top-0 h-full w-0.5 bg-neutral-500"
                      style={{ left: `${benchRange ? ((bench.mid - bench.min) / benchRange) * 100 : 50}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-neutral-400">
                This offer sits at the <strong className="text-neutral-700">{percentile}th percentile</strong>{" "}
                for {bench.role.toLowerCase()}s based on {bench.count} VN data points.
              </p>
            </div>

            {/* Quick facts */}
            <div className="rounded-16 border border-neutral-100 bg-white p-5">
              <h4 className="mb-3 text-[13px] font-semibold text-neutral-900">Quick facts</h4>
              <div className="space-y-2.5">
                {[
                  { icon: <MapPin size={13} />, k: "Visa needed", v: "No · remote" },
                  { icon: <Clock size={13} />, k: "Timezone overlap", v: timezone },
                  { icon: <FileText size={13} />, k: "Contract type", v: JOB_TYPE_LABELS[job.jobType] },
                  {
                    icon: <Monitor size={13} />,
                    k: "Equipment",
                    v: job.benefits.some((b) => b.toLowerCase().includes("equipment"))
                      ? "Provided"
                      : "Self-supplied",
                  },
                  { icon: <Users size={13} />, k: "Interview rounds", v: "~3" },
                ].map((r) => (
                  <div className="flex items-center justify-between text-[13px]" key={r.k}>
                    <span className="flex items-center gap-1.5 text-neutral-400">
                      {r.icon} {r.k}
                    </span>
                    <span className="font-medium text-neutral-700">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Company */}
            <div className="rounded-16 border border-neutral-100 bg-white p-5">
              <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-neutral-400">
                Company
              </h3>
              <div className="mb-3 flex items-center gap-3">
                <CompanyLogo color={color} initial={initial} size={40} />
                <div>
                  <p className="text-[14px] font-semibold text-neutral-900">
                    {job.employer.companyName}
                  </p>
                  <p className="text-[12px] text-neutral-400">
                    {countryFlag(job.country)} {country}
                    {job.employer.size ? ` · ${job.employer.size} employees` : ""}
                  </p>
                </div>
              </div>
              {job.employer.description && (
                <p className="text-[13px] leading-relaxed text-neutral-500">
                  {job.employer.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
