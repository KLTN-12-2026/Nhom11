import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Zap, ShieldCheck, Users, RefreshCw, ArrowRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/constants/routes";

const SALARY_DATA = [
  {
    role: "Software Engineer",
    seniority: "Junior",
    min: 900,
    p25: 1200,
    median: 1500,
    p75: 1900,
    max: 2400,
    samples: 84,
  },
  {
    role: "Software Engineer",
    seniority: "Mid",
    min: 1800,
    p25: 2400,
    median: 3000,
    p75: 3700,
    max: 4500,
    samples: 142,
  },
  {
    role: "Software Engineer",
    seniority: "Senior",
    min: 3200,
    p25: 4000,
    median: 4800,
    p75: 5800,
    max: 7200,
    samples: 96,
  },
  {
    role: "Software Engineer",
    seniority: "Staff",
    min: 5500,
    p25: 6500,
    median: 7800,
    p75: 9200,
    max: 11500,
    samples: 28,
  },
  {
    role: "Product Designer",
    seniority: "Mid",
    min: 1400,
    p25: 1900,
    median: 2400,
    p75: 3100,
    max: 3800,
    samples: 51,
  },
  {
    role: "Product Designer",
    seniority: "Senior",
    min: 2800,
    p25: 3400,
    median: 4100,
    p75: 5000,
    max: 6400,
    samples: 36,
  },
  {
    role: "Product Manager",
    seniority: "Mid",
    min: 1800,
    p25: 2400,
    median: 3000,
    p75: 3700,
    max: 4500,
    samples: 41,
  },
  {
    role: "Product Manager",
    seniority: "Senior",
    min: 3400,
    p25: 4200,
    median: 5000,
    p75: 6100,
    max: 7500,
    samples: 27,
  },
  {
    role: "Data Analyst",
    seniority: "Mid",
    min: 1300,
    p25: 1800,
    median: 2300,
    p75: 2900,
    max: 3600,
    samples: 38,
  },
  {
    role: "Data Engineer",
    seniority: "Senior",
    min: 3000,
    p25: 3800,
    median: 4600,
    p75: 5600,
    max: 6800,
    samples: 22,
  },
  {
    role: "Marketing Manager",
    seniority: "Mid",
    min: 1100,
    p25: 1500,
    median: 1900,
    p75: 2400,
    max: 3000,
    samples: 47,
  },
  {
    role: "Customer Success",
    seniority: "Mid",
    min: 900,
    p25: 1300,
    median: 1700,
    p75: 2100,
    max: 2700,
    samples: 32,
  },
  {
    role: "DevOps / Platform",
    seniority: "Senior",
    min: 3500,
    p25: 4200,
    median: 5100,
    p75: 6200,
    max: 7600,
    samples: 24,
  },
];

const COUNTRY_BANDS = [
  {
    country: "Singapore",
    flag: "🇸🇬",
    median: 3800,
    range: "2.4k–6.2k",
    jobs: 18,
    color: "text-brand-700",
  },
  {
    country: "Australia",
    flag: "🇦🇺",
    median: 4200,
    range: "2.8k–7.5k",
    jobs: 14,
    color: "text-blue-600",
  },
  {
    country: "United States (remote-first)",
    flag: "🇺🇸",
    median: 5600,
    range: "3.5k–9k",
    jobs: 11,
    color: "text-amber-600",
  },
  {
    country: "Europe (remote-first)",
    flag: "🇪🇺",
    median: 3400,
    range: "2.2k–5.4k",
    jobs: 4,
    color: "text-neutral-600",
  },
];

const HISTOGRAM_BUCKETS = [
  { range: "<1k", pct: 4 },
  { range: "1–2k", pct: 14 },
  { range: "2–3k", pct: 22 },
  { range: "3–4k", pct: 26 },
  { range: "4–5k", pct: 18 },
  { range: "5–7k", pct: 11 },
  { range: "7–10k", pct: 4 },
  { range: ">10k", pct: 1 },
];

const ROLES = [
  "Software Engineer",
  "Product Designer",
  "Product Manager",
  "Data Analyst",
  "Data Engineer",
  "Marketing Manager",
  "Customer Success",
  "DevOps / Platform",
];
const SENIORITIES = ["All", "Junior", "Mid", "Senior", "Staff"];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={cn(
        "rounded-8 border px-3 py-1.5 text-[12.5px] font-medium transition-all",
        active
          ? "border-brand-600 bg-brand-50 text-brand-700"
          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function SalaryBar({
  row,
  globalMax,
  fmt,
}: {
  row: (typeof SALARY_DATA)[0];
  globalMax: number;
  fmt: (n: number) => string;
}) {
  const pct = (v: number) => `${(v / globalMax) * 100}%`;
  return (
    <div className="flex flex-col gap-3 border-b border-neutral-50 py-5 last:border-none sm:flex-row sm:items-center">
      <div className="w-44 flex-shrink-0">
        <p className="text-[13.5px] font-medium text-neutral-900">
          {row.seniority} {row.role}
        </p>
        <p className="text-[11.5px] text-neutral-400">n = {row.samples} offers</p>
      </div>
      <div className="flex-1">
        <div className="relative mb-2 h-2 w-full rounded-full bg-neutral-100">
          {/* IQR band */}
          <span
            className="absolute h-full rounded-full bg-brand-200"
            style={{ left: pct(row.p25), width: `${((row.p75 - row.p25) / globalMax) * 100}%` }}
          />
          {/* Median */}
          <span
            className="absolute -top-1 h-4 w-0.5 rounded-full bg-brand-600"
            style={{ left: pct(row.median) }}
            title={`Median ${fmt(row.median)}`}
          />
          {/* Min */}
          <span
            className="absolute top-0 h-2 w-1 -translate-x-1/2 rounded-sm bg-neutral-300"
            style={{ left: pct(row.min) }}
            title={`Min ${fmt(row.min)}`}
          />
          {/* Max */}
          <span
            className="absolute top-0 h-2 w-1 -translate-x-1/2 rounded-sm bg-neutral-400"
            style={{ left: pct(row.max) }}
            title={`Max ${fmt(row.max)}`}
          />
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-400">{fmt(row.min)}</span>
          <span className="font-medium text-neutral-700">
            median <strong className="font-semibold text-neutral-900">{fmt(row.median)}</strong>
          </span>
          <span className="text-neutral-400">{fmt(row.max)}</span>
        </div>
      </div>
    </div>
  );
}

function ExplorerSection() {
  const [role, setRole] = useState("Software Engineer");
  const [seniority, setSeniority] = useState("All");
  const [currency, setCurrency] = useState<"USD" | "VND">("USD");

  const globalMax = Math.max(...SALARY_DATA.map((r) => r.max));
  const fmt = (n: number) =>
    currency === "VND"
      ? `${((n * 25.5) / 1000).toFixed(0)}M₫`
      : `$${n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : n}`;

  const rows = useMemo(
    () => SALARY_DATA.filter((r) => r.role === role && (seniority === "All" || r.seniority === seniority)),
    [role, seniority]
  );

  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              Explorer
            </p>
            <h2 className="text-[28px] font-semibold tracking-tight text-neutral-900">
              Salary by{" "}
              <em className="font-serif italic text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
                role &amp; seniority
              </em>
            </h2>
          </div>
          <div className="flex items-center gap-0.5 rounded-8 border border-neutral-200 bg-white p-0.5">
            {(["USD", "VND"] as const).map((c) => (
              <button
                className={cn(
                  "rounded-6 px-3 py-1.5 text-[12px] font-medium transition-all",
                  currency === c ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-700"
                )}
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Role chips */}
        <div className="mb-4">
          <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-neutral-400">Role</p>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <Chip active={role === r} key={r} onClick={() => setRole(r)}>
                {r}
              </Chip>
            ))}
          </div>
        </div>

        {/* Seniority chips */}
        <div className="mb-8">
          <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-neutral-400">
            Seniority
          </p>
          <div className="flex flex-wrap gap-2">
            {SENIORITIES.map((s) => (
              <Chip active={seniority === s} key={s} onClick={() => setSeniority(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </div>

        {/* Chart card */}
        <div className="rounded-20 border border-neutral-100 bg-white p-6 shadow-card">
          {/* Legend */}
          <div className="mb-5 flex flex-wrap items-center gap-5 border-b border-neutral-50 pb-4">
            <div className="flex items-center gap-2 text-[11.5px] text-neutral-400">
              <span className="h-2 w-8 rounded-full bg-brand-200" />
              25th – 75th percentile
            </div>
            <div className="flex items-center gap-2 text-[11.5px] text-neutral-400">
              <span className="h-3.5 w-0.5 rounded-full bg-brand-600" />
              Median
            </div>
            <div className="flex items-center gap-2 text-[11.5px] text-neutral-400">
              <span className="h-2 w-1 rounded-sm bg-neutral-400" />
              Min / max
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-neutral-400">
              No data yet for <strong>{role}</strong> at <strong>{seniority}</strong>. Try another
              seniority.
            </div>
          ) : (
            <div>
              {rows.map((row) => (
                <SalaryBar fmt={fmt} globalMax={globalMax} key={row.role + row.seniority} row={row} />
              ))}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-5 flex items-start gap-2 rounded-12 bg-neutral-50 px-4 py-3 text-[12.5px] text-neutral-500">
          <Zap className="mt-0.5 flex-shrink-0 text-amber-500" size={14} />
          All figures are gross monthly salary in USD unless toggled. Bonuses &amp; equity excluded.
          Submit your offer anonymously to help refine these numbers.
        </div>
      </div>
    </section>
  );
}

function CountrySection() {
  return (
    <section className="border-y border-neutral-100 bg-white py-16">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            By country
          </p>
          <h2 className="text-[28px] font-semibold tracking-tight text-neutral-900">
            Where the{" "}
            <em className="font-serif italic text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
              money
            </em>{" "}
            lives
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-neutral-500">
            Median compensation for mid-level remote roles, by where the company is headquartered.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COUNTRY_BANDS.map((c) => (
            <div
              className="rounded-20 border border-neutral-100 bg-white p-6 text-center transition-shadow hover:shadow-card"
              key={c.country}
            >
              <div className="mb-2 text-[36px] leading-none">{c.flag}</div>
              <p className="mb-3 text-[13.5px] font-medium text-neutral-700">{c.country}</p>
              <p className={cn("mb-1 text-[32px] font-semibold leading-none tracking-tight", c.color)}>
                ${c.median.toLocaleString()}
                <span className="ml-0.5 text-[14px] font-normal text-neutral-400">/mo</span>
              </p>
              <p className="mb-3 text-[12px] text-neutral-400">Range {c.range}</p>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11.5px] font-medium text-neutral-500">
                {c.jobs} open this month
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DistributionSection() {
  const maxPct = Math.max(...HISTOGRAM_BUCKETS.map((b) => b.pct));
  return (
    <section className="bg-neutral-900 py-16">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              Distribution
            </p>
            <h2 className="mb-3 text-[28px] font-semibold tracking-tight text-white">
              The{" "}
              <em className="font-serif italic text-brand-400" style={{ fontFamily: "var(--font-serif)" }}>
                shape
              </em>{" "}
              of remote pay.
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-neutral-400">
              Most VN talent working remote sits in the $2k–$5k band. The fat tail is real — but it
              lives at senior + staff levels with US-based companies.
            </p>
            <ul className="space-y-2.5">
              {[
                <>
                  <strong className="text-white">72%</strong> of placements between $2k–$5k
                </>,
                <>
                  <strong className="text-white">$3,200</strong> is the median across all roles
                </>,
                <>
                  Staff+ engineering jobs can hit <strong className="text-white">$10k+</strong> monthly
                </>,
              ].map((item, i) => (
                <li className="flex items-start gap-2.5 text-[13.5px] text-neutral-400" key={i}>
                  <span className="bg-brand-500 mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Histogram */}
          <div className="flex h-48 items-end gap-2">
            {HISTOGRAM_BUCKETS.map((b) => (
              <div className="flex flex-1 flex-col items-center gap-1.5" key={b.range}>
                <span className="font-mono text-[10px] text-neutral-500">{b.pct}%</span>
                <div
                  className="w-full rounded-t-4 bg-brand-600/70 transition-all"
                  style={{ height: `${(b.pct / maxPct) * 100}%`, minHeight: 4 }}
                />
                <span className="text-[10px] text-neutral-500">{b.range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SubmitSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              Contribute
            </p>
            <h2 className="mb-3 text-[28px] font-semibold tracking-tight text-neutral-900">
              Submit your salary,{" "}
              <em className="font-serif italic text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
                anonymously
              </em>
              .
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-neutral-500">
              It takes 90 seconds. No name, no email required. Your data point makes the next
              person&apos;s negotiation a little bit fairer.
            </p>

            <div className="mb-6 space-y-2.5">
              {[
                { icon: ShieldCheck, label: "Encrypted & anonymized" },
                { icon: Users, label: "612 submissions so far" },
                { icon: RefreshCw, label: "Reviewed weekly by our team" },
              ].map(({ icon: Icon, label }) => (
                <div className="flex items-center gap-2.5 text-[13px] text-neutral-500" key={label}>
                  <Icon className="text-brand-600" size={14} />
                  {label}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button className="inline-flex h-11 items-center gap-2 rounded-12 bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700">
                Submit a data point <ArrowRight size={14} />
              </button>
              <Link
                className="inline-flex h-11 items-center gap-2 px-5 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                to={ROUTES.jobs}
              >
                See live jobs
              </Link>
            </div>
          </div>

          {/* Form preview */}
          <div className="rounded-20 border border-neutral-200 bg-neutral-50 p-6">
            {[
              { k: "Role", v: "Senior Frontend Engineer" },
              { k: "Company HQ", v: "🇸🇬 Singapore" },
              { k: "Years exp.", v: "6" },
              { k: "Base / month", v: "$5,200", highlight: true },
              { k: "Equity", v: "0.05% @ $40M" },
            ].map(({ k, v, highlight }) => (
              <div
                className="flex items-center justify-between border-b border-neutral-200/60 py-3 last:border-none"
                key={k}
              >
                <span className="text-[12.5px] text-neutral-500">{k}</span>
                <span className={cn("text-[13px] font-medium", highlight ? "font-semibold text-brand-700" : "text-neutral-900")}>
                  {v}
                </span>
              </div>
            ))}
            <div className="mt-3 flex items-center gap-2 border-t border-neutral-200 pt-3 text-[12px] text-neutral-400">
              <ShieldCheck className="text-brand-600" size={13} />
              Anonymous · One field at a time
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SalaryPage() {
  useDocumentTitle("Remote Salary Guide — Vietnam Talent");
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-16 lg:py-20">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 80% 0%, rgba(46,155,82,0.08) 0%, transparent 60%), #F8F7F4",
          }}
        />
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="mb-5 inline-flex items-center gap-2 text-[12px] font-semibold text-neutral-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-600" />
            Updated weekly · 612 data points from 2026
          </div>
          <h1 className="mb-4 max-w-2xl text-[clamp(32px,4.5vw,52px)] font-semibold leading-[1.1] tracking-tight text-neutral-900">
            What should you{" "}
            <em className="font-serif italic text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
              actually
            </em>{" "}
            earn working remotely?
          </h1>
          <p className="mb-10 max-w-xl text-[16px] leading-relaxed text-neutral-500">
            Real numbers from real offers — submitted by Vietnamese professionals working for
            Singapore, Australia &amp; US companies. No &ldquo;competitive salary&rdquo; nonsense.
          </p>

          <div className="flex flex-wrap gap-x-10 gap-y-5">
            {[
              { num: "612", label: "Data points" },
              { num: "$3,200", label: "Median mid-level / month" },
              { num: "+38%", label: "YoY remote vs local SG/AU" },
              { num: "Mar 12", label: "Last refresh" },
            ].map((s, i) => (
              <div className="flex items-center gap-4" key={s.label}>
                {i > 0 && <div className="hidden h-8 w-px bg-neutral-200 sm:block" />}
                <div>
                  <p className="text-[26px] font-semibold tracking-tight text-neutral-900">{s.num}</p>
                  <p className="text-[12px] text-neutral-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ExplorerSection />
      <CountrySection />
      <DistributionSection />
      <SubmitSection />
    </>
  );
}
