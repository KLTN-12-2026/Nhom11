import { Link } from "react-router-dom";
import { ArrowRight, Bell, ShieldCheck, Star } from "lucide-react";
import { JobCard } from "@/features/jobs/components/JobCard";
import { NewsletterForm } from "@/components/home/NewsletterForm";
import { SalaryBenchmark } from "@/components/home/SalaryBenchmark";
import { CompanyLogo } from "@/components/ui/company-logo";
import { SalaryBadge } from "@/components/ui/salary-badge";
import { Tag } from "@/components/ui/tag";
import { useJobsQuery } from "@/features/jobs/jobs.queries";
import { DEFAULT_JOB_FILTERS } from "@/features/jobs/job-filters";
import { LEVEL_LABELS, companyColor, countryFlag } from "@/features/jobs/jobs.utils";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/constants/routes";

const STATS = [
  { value: "47", label: "Jobs live" },
  { value: "12", label: "Verified employers" },
  { value: "500+", label: "Talent profiles" },
  { value: "$2.4k", label: "Avg monthly" },
  { value: "SG · AU · US", label: "Hiring from" },
];

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Browse verified jobs",
    desc: "Each job shows the salary range, timezone fit, and which Vietnamese talent already work at the company. No more guessing.",
  },
  {
    num: "02",
    title: "Track applications in one place",
    desc: "A simple tracker that replaces your Google Sheet. Move from saved → applied → interviewing → offer.",
  },
  {
    num: "03",
    title: "Land your first remote offer",
    desc: "Your profile is visible to employers actively looking for VN talent. Inbound matters as much as outbound.",
  },
];

const CATEGORIES = [
  { label: "Engineering", count: 31, color: "bg-brand-50 text-brand-700" },
  { label: "Design", count: 8, color: "bg-purple-50 text-purple-700" },
  { label: "Product", count: 5, color: "bg-blue-50 text-blue-700" },
  { label: "Data", count: 7, color: "bg-amber-50 text-amber-700" },
  { label: "Marketing", count: 4, color: "bg-rose-50 text-rose-700" },
  { label: "Operations", count: 2, color: "bg-neutral-100 text-neutral-700" },
];

const TESTIMONIALS = [
  {
    quote:
      "I tried Upwork for two years but the competition was brutal. Through this platform I applied to a Singapore startup that fit my timezone and got an offer at $2,800/month within three weeks.",
    name: "Phạm Tuấn",
    title: "Frontend Developer · Hired by Finch Labs (SG)",
    meta: "$2,800/mo · 3 weeks",
    initials: "PT",
    color: "#2E9B52",
  },
  {
    quote:
      "The salary benchmark was a game-changer. I'd been undercharging by 40%. Renegotiated my current contract using the data here and got bumped up before even applying anywhere.",
    name: "Nguyễn Anh",
    title: "Product Designer · Brackish (SG)",
    meta: "$3,400/mo · current",
    initials: "NA",
    color: "#0EA5E9",
  },
  {
    quote:
      "First place I've seen that actually tells you which companies have VN people already. That signal alone saved me weeks of 'do they hire remote? do they hire Vietnamese?' guesswork.",
    name: "Lê Hoàng",
    title: "Backend Engineer · Sea Group (SG)",
    meta: "$3,200/mo · 5 weeks",
    initials: "LH",
    color: "#EE4D2D",
  },
];

export function HomePage() {
  useDocumentTitle("Remote Jobs from SG, AU & beyond");
  const { data } = useJobsQuery(DEFAULT_JOB_FILTERS, 4);
  const featuredJobs = data?.jobs ?? [];

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neutral-50 to-white" />
        <div className="mx-auto grid max-w-[1240px] items-center gap-16 px-6 py-20 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-100 bg-white px-3 py-1.5 text-[13px] text-neutral-500 shadow-[0_1px_2px_rgba(26,25,23,0.06)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-600" />
              47 jobs live · updated today
            </div>

            <h1 className="mb-5 text-[44px] font-semibold leading-[1.1] tracking-tight text-neutral-900 lg:text-[52px]">
              Remote jobs from Singapore, Australia &amp; beyond —{" "}
              <em
                className="font-serif italic not-italic text-brand-700"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                curated
              </em>{" "}
              for Vietnam talent.
            </h1>

            <p className="mb-8 max-w-xl text-[17px] leading-relaxed text-neutral-500">
              Việt Nam has talent. The world has jobs. We connect both — with clear salary ranges,
              sensible timezones, and employers we&apos;ve actually vetted.
            </p>

            <div className="mb-8 flex items-center gap-3">
              <Link
                className="inline-flex h-[52px] items-center gap-2 rounded-12 bg-brand-600 px-6 text-[15px] font-medium text-white transition-colors hover:bg-brand-700"
                to={ROUTES.jobs}
              >
                Browse 47 open jobs
                <ArrowRight size={16} />
              </Link>
              <Link
                className="inline-flex h-[52px] items-center gap-2 rounded-12 px-6 text-[15px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                to={ROUTES.register}
              >
                <Bell size={16} />
                Get weekly alerts
              </Link>
            </div>

            <div className="flex items-center gap-3 text-sm text-neutral-400">
              <div className="flex -space-x-1.5">
                {["#F59E0B", "#2E9B52", "#2563EB", "#9B9690"].map((c, i) => (
                  <span
                    className="h-7 w-7 rounded-full border-2 border-neutral-50"
                    key={i}
                    style={{ background: `linear-gradient(135deg, ${c}, ${c}dd)` }}
                  />
                ))}
              </div>
              Free for talent · 500+ VN professionals already on board
            </div>
          </div>

          {/* Float cards */}
          <div className="hidden flex-col gap-3 lg:flex">
            {featuredJobs.map((job, i) => {
              const country = job.country ?? "Remote";
              const timezone = job.timezone ?? (job.isRemote ? "Remote" : country);
              return (
                <div
                  className="flex animate-fade-up items-center gap-3 rounded-12 border border-neutral-100 bg-white p-4 shadow-card"
                  key={job.id}
                  style={{ animationDelay: `${100 + i * 120}ms` }}
                >
                  <CompanyLogo
                    color={companyColor(job.employer.companyName)}
                    initial={job.employer.companyName.charAt(0).toUpperCase()}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-1.5 text-[12px] text-neutral-400">
                      {job.employer.isVerified && <ShieldCheck className="text-brand-600" size={11} />}
                      {job.employer.companyName} · {countryFlag(job.country)} {country}
                    </div>
                    <p className="truncate text-sm font-semibold text-neutral-900">{job.title}</p>
                    <div className="mt-1 flex gap-1.5">
                      <Tag>{timezone}</Tag>
                      <Tag>{LEVEL_LABELS[job.level]}</Tag>
                    </div>
                  </div>
                  <SalaryBadge max={job.salaryMax ?? 0} min={job.salaryMin ?? 0} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section className="border-y border-neutral-100 bg-white">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-6 px-6 py-10 md:grid-cols-5">
          {STATS.map((s) => (
            <div className="text-center" key={s.label}>
              <div className="text-[26px] font-semibold tracking-tight text-neutral-900">
                {s.value}
              </div>
              <div className="mt-0.5 text-[13px] text-neutral-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="mb-12 text-center">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              How it works
            </p>
            <h2 className="text-[36px] font-semibold tracking-tight text-neutral-900">
              Simple. Curated.{" "}
              <em className="font-serif" style={{ fontFamily: "var(--font-serif)" }}>
                Built for you.
              </em>
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-neutral-500">
              Every job is reviewed before it goes live. Salary range required. Employer verified.
              No ghost listings.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <div className="rounded-16 border border-neutral-100 bg-white p-6" key={step.num}>
                <div className="mb-3 text-[13px] font-semibold text-brand-600">{step.num}</div>
                <h3 className="mb-2 text-[17px] font-semibold text-neutral-900">{step.title}</h3>
                <p className="text-[14px] leading-relaxed text-neutral-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────── */}
      <section className="pb-16">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="mb-8">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              Categories
            </p>
            <h2 className="text-[28px] font-semibold text-neutral-900">
              Find roles in{" "}
              <em className="font-serif" style={{ fontFamily: "var(--font-serif)" }}>
                your
              </em>{" "}
              field
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <Link
                className="group flex items-center justify-between rounded-12 border border-neutral-100 bg-white px-4 py-3 transition-all hover:border-neutral-200 hover:shadow-card"
                key={cat.label}
                to={`/jobs?category=${cat.label}`}
              >
                <span className="text-[13px] font-medium text-neutral-700 group-hover:text-neutral-900">
                  {cat.label}
                </span>
                <span className="flex items-center gap-0.5 text-[12px] text-neutral-400">
                  {cat.count}
                  <ArrowRight size={11} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Salary Benchmark ──────────────────────────────────── */}
      <SalaryBenchmark />

      {/* ── Featured jobs ─────────────────────────────────────── */}
      <section className="pb-16">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                Live now
              </p>
              <h2 className="text-[28px] font-semibold text-neutral-900">
                Jobs open{" "}
                <em className="font-serif" style={{ fontFamily: "var(--font-serif)" }}>
                  right now
                </em>
              </h2>
            </div>
            <Link
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
              to={ROUTES.jobs}
            >
              Browse all 47 jobs <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {featuredJobs.map((job) => (
              <JobCard job={job} key={job.id} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Founder Story ─────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            The story
          </div>
          <h2 className="mb-10 text-[32px] font-semibold tracking-tight text-neutral-900">
            Built by someone who&apos;s{" "}
            <em
              className="font-serif italic text-brand-700"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              actually done it.
            </em>
          </h2>
          <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
            {/* Aside */}
            <div>
              <div className="mb-4 h-48 w-48 rounded-24 bg-gradient-to-br from-brand-200 to-brand-600" />
              <div className="space-y-2">
                {[
                  { k: "Years remote", v: "7" },
                  { k: "Upwork hours", v: "10,400+" },
                  { k: "Upwork rank", v: "Top Plus" },
                  { k: "Based in", v: "Đà Nẵng, VN" },
                  { k: "Worked with", v: "SG · AU · US" },
                ].map((s) => (
                  <div
                    className="flex items-center justify-between rounded-8 bg-neutral-50 px-3 py-2 text-[13px]"
                    key={s.k}
                  >
                    <span className="text-neutral-500">{s.k}</span>
                    <span className="font-semibold text-neutral-900">{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Prose */}
            <div className="flex flex-col justify-center">
              <blockquote className="mb-5 border-l-2 border-brand-600 pl-5">
                <p className="text-[17px] italic leading-relaxed text-neutral-700">
                  &ldquo;I&apos;ve worked remotely for companies in Singapore, Australia, and the US
                  for seven years.{" "}
                  <strong className="not-italic text-neutral-900">
                    Top Plus on Upwork. Over 10,000 hours billed.
                  </strong>{" "}
                  Every year, dozens of people ask me the same question: how did you find it?&rdquo;
                </p>
              </blockquote>
              <p className="mb-4 text-[15px] leading-relaxed text-neutral-600">
                I couldn&apos;t answer that question for each person individually. So I built the
                answer instead.
              </p>
              <p className="mb-4 text-[15px] leading-relaxed text-neutral-600">
                Every job here gets reviewed by me before going live. Salary ranges are required. I
                check the company is real, the team is hiring, and the comp is fair for VN talent.
                If it&apos;s not, it doesn&apos;t go up.
              </p>
              <div className="mt-2">
                <div className="text-[15px] font-semibold text-neutral-900">— Trần Minh</div>
                <div className="text-[13px] text-neutral-400">
                  Founder · Đà Nẵng, Vietnam · Building since Mar 2025
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section className="border-y border-neutral-100 bg-white py-16">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="mb-10 text-center">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              Talent stories
            </p>
            <h2 className="text-[32px] font-semibold text-neutral-900">
              From{" "}
              <em className="font-serif" style={{ fontFamily: "var(--font-serif)" }}>
                apply
              </em>{" "}
              to{" "}
              <em className="font-serif" style={{ fontFamily: "var(--font-serif)" }}>
                offer
              </em>
              .
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div className="rounded-16 border border-neutral-100 bg-neutral-50 p-6" key={t.name}>
                <p className="mb-5 text-[14px] italic leading-relaxed text-neutral-700">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
                    style={{ background: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-neutral-900">{t.name}</div>
                    <div className="text-[12px] text-neutral-400">{t.title}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-amber-700">{t.meta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Employer CTA ──────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="flex flex-col items-center gap-10 rounded-24 bg-neutral-900 p-10 md:flex-row">
            <div className="flex-1">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                For employers
              </p>
              <h2 className="mb-3 text-[28px] font-semibold leading-tight text-white">
                Looking for remote talent in Vietnam?
              </h2>
              <p className="mb-6 max-w-sm text-sm leading-relaxed text-neutral-400">
                Post your job and reach 500+ qualified VN professionals. Verified listings, salary
                range required, results in two weeks or money back.
              </p>
              <div className="flex gap-3">
                <Link
                  className="inline-flex h-11 items-center gap-2 rounded-12 bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                  to={ROUTES.employer}
                >
                  Post a job — from $150 <ArrowRight size={14} />
                </Link>
                <Link
                  className="inline-flex h-11 items-center px-5 text-sm font-medium text-neutral-300 transition-colors hover:text-white"
                  to="#"
                >
                  Talk to founder
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              {[
                "Every job is human-reviewed before going live",
                "Salary range required — attracts serious applicants",
                "30-day listing · Renewable · Featured slot available",
                "Direct line to founder. Real human, not a ticket system.",
              ].map((item) => (
                <div className="flex items-start gap-2.5 text-sm text-neutral-400" key={item}>
                  <span className="mt-0.5 grid h-4 w-4 flex-shrink-0 place-items-center rounded-full bg-brand-600">
                    <Star className="text-white" fill="white" size={9} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────────── */}
      <section className="pb-20">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="rounded-24 border border-brand-100 bg-brand-50 p-10 text-center">
            <h2 className="mb-2 text-[28px] font-semibold text-neutral-900">
              Don&apos;t miss the{" "}
              <em className="font-serif text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
                next
              </em>{" "}
              opportunity.
            </h2>
            <p className="mx-auto mb-6 max-w-md text-sm text-neutral-500">
              Every Friday: top 8 remote jobs curated for VN/SEA talent, salary tips, and remote
              work insights you won&apos;t find on LinkedIn.
            </p>
            <NewsletterForm />
            <p className="mt-3 text-xs text-neutral-400">
              Join 1,200+ subscribers · No spam · Unsubscribe anytime
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
