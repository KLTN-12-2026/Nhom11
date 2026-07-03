import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Check, Minus, ShieldCheck } from "lucide-react";
import { PricingSection } from "@/features/employer/components/PricingSection";
import { FAQSection } from "@/features/employer/components/FAQSection";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/constants/routes";

const COMPANIES = ["Finch Labs", "Brackish", "Meridian", "Northwind", "Cedar Co", "Altimeter", "Sky Mavis", "Carousell"];

const WHY = [
  {
    num: "3.5×",
    title: "Better response rate",
    desc: "VN talent we surveyed report applying to 3.5× more relevant roles here than on LinkedIn. The 'remote-from-VN-friendly' signal saves them hours of guesswork.",
  },
  {
    num: "14 days",
    title: "Median time to hire",
    desc: "From listing live to signed offer, our median is 14 days. Because the applicants self-select — verified employer, salary stated, timezone clear.",
  },
  {
    num: "87%",
    title: "Listings filled",
    desc: "Of all jobs posted in 2025, 87% were filled within the 30-day window. The 13% that weren't either paused or relisted with adjusted comp.",
  },
];

const COMPARE = [
  { f: "VN-specific talent pool", us: true, li: false, ro: false, up: "partial" },
  { f: "Salary range required", us: true, li: false, ro: "partial", up: false },
  { f: "Verified employer signal", us: true, li: false, ro: false, up: "partial" },
  { f: "Direct line to founder", us: true, li: false, ro: false, up: false },
  { f: "Pay per post (vs subscription)", us: true, li: false, ro: true, up: true },
  { f: "Hands-on screening option", us: true, li: false, ro: false, up: false },
  { f: "Money-back guarantee", us: true, li: false, ro: false, up: false },
];

const PROCESS = [
  {
    num: "01",
    title: "Submit your role",
    desc: "A 15-minute form: role, level, salary range, timezone needs, must-haves. You can paste from an existing JD; we'll structure it.",
    items: ["Salary range required (we mean it)", "Timezone clarity required", "Optional: equity, benefits, equipment"],
  },
  {
    num: "02",
    title: "We review & verify",
    desc: "Within 4–8 working hours, a real person at RemoteSEA checks the company, validates the comp range against our data, and flags issues.",
    items: ["Manual review by founder", "Comp benchmarked against 847 data points", "Edit-then-publish flow"],
  },
  {
    num: "03",
    title: "Receive matched candidates",
    desc: "Listing goes live, alerts go out to subscribers in your category, and applications flow into a single dashboard. Median to first hire: 14 days.",
    items: ["Centralized application inbox", "Match-score on every application", "Optional white-glove screening"],
  },
];

const APPLICANTS = [
  { name: "Phạm Tuấn", role: "Sr. Frontend · 6 yrs", loc: "Đà Nẵng, VN", match: 94 },
  { name: "Nguyễn Anh", role: "Frontend / Design Eng · 5 yrs", loc: "Hà Nội, VN", match: 88 },
  { name: "Lê Hoàng", role: "Sr. Frontend · 7 yrs", loc: "TP.HCM, VN", match: 82 },
];

type CellValue = boolean | "partial";

function CompareCell({ v, highlight }: { v: CellValue; highlight?: boolean }) {
  if (v === true)
    return (
      <span className={`inline-grid h-7 w-7 place-items-center rounded-full ${highlight ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-400"}`}>
        <Check size={13} />
      </span>
    );
  if (v === false)
    return (
      <span className="inline-grid h-7 w-7 place-items-center rounded-full text-neutral-300">
        <Minus size={13} />
      </span>
    );
  return <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700">partial</span>;
}

export function EmployerMarketingPage() {
  useDocumentTitle("For Employers — Hire Vietnam Remote Talent");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 90% 20%, rgba(46,155,82,0.10) 0%, transparent 60%), #F8F7F4",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{
            backgroundImage: "linear-gradient(#EFEDE8 1px, transparent 1px), linear-gradient(90deg, #EFEDE8 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse 100% 70% at 30% 30%, black, transparent 70%)",
          }}
        />

        <div className="mx-auto grid max-w-[1240px] items-center gap-16 px-6 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-[12px] font-medium text-brand-700">
              <Building2 size={13} /> For hiring teams
            </div>

            <h1 className="mb-4 font-serif text-[clamp(40px,5.5vw,60px)] leading-[1.15] tracking-tight text-neutral-900" style={{ fontFamily: "var(--font-serif)" }}>
              Hire from Vietnam.
              <br />
              <em className="italic text-brand-700">The right way.</em>
            </h1>

            <p className="mb-8 text-[17px] leading-relaxed text-neutral-500">
              500+ qualified VN/SEA professionals. Verified employers only. Salary range required. The
              signal-to-noise ratio of LinkedIn at a fraction of the cost.
            </p>

            <div className="mb-5 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-[52px] items-center gap-2 rounded-12 bg-brand-600 px-6 text-[15px] font-medium text-white transition-colors hover:bg-brand-700"
                to="#pricing"
              >
                Post a job — from $150 <ArrowRight size={16} />
              </Link>
              <a
                className="inline-flex h-[52px] items-center gap-2 rounded-12 px-6 text-[15px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
                href="mailto:hello@remotesea.io"
              >
                Talk to founder
              </a>
            </div>

            <p className="inline-flex items-center gap-2 text-[12.5px] text-neutral-400">
              <ShieldCheck className="text-brand-600" size={14} />
              30-day money-back guarantee · No card on file required
            </p>
          </div>

          {/* Dashboard mock */}
          <div className="hidden lg:block">
            <div className="relative rounded-24 border border-neutral-200 bg-white p-6 shadow-card-lg">
              <div
                className="pointer-events-none absolute -inset-px -z-10 rounded-24 opacity-50"
                style={{
                  background: "linear-gradient(135deg, rgba(46,155,82,0.25), transparent 50%, rgba(245,158,11,0.20))",
                  filter: "blur(20px)",
                }}
              />
              <div className="mb-5 flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-2.5 text-[14.5px] font-semibold text-neutral-900">
                  <span className="relative h-2 w-2 rounded-full bg-brand-600">
                    <span className="absolute inset-0 animate-ping rounded-full bg-brand-600 opacity-50" />
                  </span>
                  Senior Frontend · Editor team
                </div>
                <span className="text-[11.5px] font-medium uppercase tracking-wider text-neutral-400">Live · 4 days left</span>
              </div>

              <div className="mb-5 grid grid-cols-3 gap-3">
                {[
                  { num: "142", label: "Views", bars: [3, 5, 4, 6, 8, 7, 9, 11, 10, 14], color: "bg-brand-600" },
                  { num: "28", label: "Applications", bars: [1, 2, 2, 3, 3, 4, 5, 4, 6, 8], color: "bg-amber-400" },
                  { num: "7", label: "Shortlisted", bars: [0, 0, 1, 1, 2, 2, 3, 4, 5, 7], color: "bg-blue-400" },
                ].map((stat) => (
                  <div className="flex flex-col gap-1 rounded-12 bg-neutral-50 p-3" key={stat.label}>
                    <div className="font-serif text-[28px] leading-none tracking-tight text-neutral-900" style={{ fontFamily: "var(--font-serif)" }}>
                      {stat.num}
                    </div>
                    <div className="text-[10.5px] font-medium uppercase tracking-widest text-neutral-400">{stat.label}</div>
                    <div className="mt-1.5 flex h-7 items-end gap-0.5">
                      {stat.bars.map((h, i) => (
                        <span className={`flex-1 rounded-sm opacity-65 ${stat.color}`} key={i} style={{ height: `${h * 2}px`, minHeight: 4 }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-3 border-t border-neutral-100 pt-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                Recent applications
              </div>
              <div className="flex flex-col gap-1">
                {APPLICANTS.map((a) => (
                  <div className="flex items-center gap-3 rounded-12 px-3 py-2.5 transition-colors hover:bg-neutral-50" key={a.name}>
                    <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-semibold text-white">
                      {a.name.trim().split(" ").pop()?.[0] ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold text-neutral-900">{a.name}</div>
                      <div className="text-[11.5px] text-neutral-400">
                        {a.role} · {a.loc}
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${a.match > 90 ? "bg-brand-50 text-brand-700" : "bg-neutral-100 text-neutral-500"}`}>
                      {a.match}% match
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo strip */}
      <div className="border-y border-neutral-100 bg-neutral-50 py-8">
        <div className="mx-auto max-w-[1240px] px-6">
          <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Trusted by hiring teams at</p>
          <div className="flex flex-wrap justify-center gap-x-14 gap-y-3">
            {COMPANIES.map((name) => (
              <span className="cursor-default font-serif text-[22px] italic tracking-tight text-neutral-300 transition-colors hover:text-neutral-700" key={name} style={{ fontFamily: "var(--font-serif)" }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Why */}
      <section className="py-20">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="mb-12 text-center">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Why post here</p>
            <h2 className="text-[36px] font-semibold tracking-tight text-neutral-900">
              Smaller pool.{" "}
              <em className="font-serif italic text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
                Higher signal.
              </em>
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-neutral-500">
              We&apos;re not trying to be the biggest. We&apos;re trying to be the place where the right VN
              candidates actually apply — and you get to interview five people, not five hundred.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {WHY.map((item) => (
              <div className="rounded-24 border border-neutral-100 bg-white p-8 transition-colors hover:border-neutral-200" key={item.title}>
                <div className="mb-4 font-serif text-[64px] italic leading-none tracking-tight text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
                  {item.num}
                </div>
                <h3 className="mb-2 text-[17px] font-semibold tracking-tight text-neutral-900">{item.title}</h3>
                <p className="text-[14px] leading-relaxed text-neutral-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compare table */}
      <section className="pb-20">
        <div className="mx-auto max-w-[1240px] px-6">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Side by side</p>
          <h2 className="mb-8 text-[32px] font-semibold tracking-tight text-neutral-900">
            Versus the{" "}
            <em className="font-serif italic" style={{ fontFamily: "var(--font-serif)" }}>
              alternatives.
            </em>
          </h2>
          <div className="overflow-hidden rounded-24 border border-neutral-100 bg-white">
            <div className="grid grid-cols-[1.4fr_repeat(4,1fr)] border-b border-neutral-100 bg-neutral-50">
              <div className="px-5 py-4" />
              {["RemoteSEA", "LinkedIn", "RemoteOK", "Upwork"].map((col, i) => (
                <div
                  className={`px-5 py-4 text-center text-[12px] font-semibold uppercase tracking-wider ${i === 0 ? "border-x border-brand-100 bg-gradient-to-b from-brand-50 to-transparent text-brand-700" : "text-neutral-400"}`}
                  key={col}
                >
                  {col}
                </div>
              ))}
            </div>
            {COMPARE.map((row, i) => (
              <div className={`grid grid-cols-[1.4fr_repeat(4,1fr)] border-b border-neutral-100 last:border-none ${i % 2 === 1 ? "bg-neutral-50/50" : ""}`} key={row.f}>
                <div className="px-5 py-4 text-[14px] font-medium text-neutral-800">{row.f}</div>
                <div className="flex items-center justify-center border-x border-brand-100 bg-gradient-to-b from-brand-50/30 to-transparent px-5 py-4">
                  <CompareCell highlight v={row.us as CellValue} />
                </div>
                {[row.li, row.ro, row.up].map((v, j) => (
                  <div className="flex items-center justify-center px-5 py-4" key={j}>
                    <CompareCell v={v as CellValue} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-neutral-100 bg-white py-20">
        <div className="mx-auto max-w-[1240px] px-6">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">The process</p>
          <h2 className="mb-10 text-[32px] font-semibold tracking-tight text-neutral-900">
            List → review →{" "}
            <em className="font-serif italic text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
              match.
            </em>
          </h2>
          <div className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {PROCESS.map((step, i) => (
              <Fragment key={step.num}>
                <div className="flex flex-col gap-3 rounded-24 border border-neutral-100 p-7">
                  <div className="font-serif text-[44px] italic leading-none text-brand-200" style={{ fontFamily: "var(--font-serif)" }}>
                    {step.num}
                  </div>
                  <div>
                    <h3 className="mb-2 text-[18px] font-semibold tracking-tight text-neutral-900">{step.title}</h3>
                    <p className="mb-3 text-[14px] leading-relaxed text-neutral-500">{step.desc}</p>
                    <ul className="space-y-1.5">
                      {step.items.map((item) => (
                        <li className="flex items-center gap-2 text-[13px] text-neutral-700" key={item}>
                          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {i < 2 && (
                  <div className="hidden place-items-center px-2 text-neutral-300 md:grid">
                    <ArrowRight size={20} />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <div id="pricing">
        <PricingSection />
      </div>

      {/* Case study */}
      <section className="pb-20">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="relative overflow-hidden rounded-24 border border-neutral-100 bg-white p-12 md:p-14">
            <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 opacity-40" style={{ background: "radial-gradient(circle, #DCEFDF 0%, transparent 60%)" }} />
            <div className="relative z-10 grid gap-12 md:grid-cols-[1.1fr_1fr]">
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Case study</p>
                <h2 className="mb-4 font-serif text-[38px] leading-[1.15] tracking-tight text-neutral-900" style={{ fontFamily: "var(--font-serif)" }}>
                  &quot;We hired our founding engineer in <em className="italic text-brand-700">11 days</em> through RemoteSEA.&quot;
                </h2>
                <p className="mb-8 text-[14.5px] leading-relaxed text-neutral-500">
                  Finch Labs (SG) needed a full-stack engineer for cross-border payments rails — Series A, 22
                  people, looking for someone with Postgres scars.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { num: "11 days", label: "List to offer" },
                    { num: "42", label: "Total applies" },
                    { num: "6", label: "Interviewed" },
                    { num: "$3.5k", label: "Final offer/mo" },
                  ].map((stat) => (
                    <div className="rounded-12 border-l-2 border-brand-600 bg-neutral-50 p-4" key={stat.label}>
                      <div className="font-serif text-[28px] leading-none tracking-tight text-neutral-900" style={{ fontFamily: "var(--font-serif)" }}>
                        {stat.num}
                      </div>
                      <div className="mt-1 text-[11.5px] font-medium uppercase tracking-wider text-neutral-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-full rounded-24 border border-neutral-200 bg-neutral-50 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-12 bg-gradient-to-br from-brand-400 to-brand-700 text-lg font-semibold text-white">F</div>
                    <div>
                      <div className="text-[15px] font-semibold text-neutral-900">Finch Labs</div>
                      <div className="text-[12.5px] text-neutral-400">SG · Series A · 22 people</div>
                    </div>
                  </div>
                  <p className="mb-5 font-serif text-[19px] italic leading-snug text-neutral-800" style={{ fontFamily: "var(--font-serif)" }}>
                    &quot;LinkedIn was sending us 200 applies, mostly noise. RemoteSEA sent 42 — and 12 of those
                    were genuinely strong. We hired #4.&quot;
                  </p>
                  <div className="flex items-center gap-2.5 border-t border-neutral-200 pt-4">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-semibold text-white">JC</div>
                    <div>
                      <div className="text-[13px] font-semibold text-neutral-900">Jia Chen</div>
                      <div className="text-[11.5px] text-neutral-400">Co-founder &amp; CTO · Finch Labs</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />

      {/* Final CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="relative overflow-hidden rounded-24 bg-neutral-900 px-12 py-16 text-center">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(143,197,42,0.15) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(245,158,11,0.12) 0%, transparent 40%), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                backgroundSize: "auto, auto, 56px 56px, 56px 56px",
              }}
            />
            <div className="relative z-10 mx-auto max-w-xl">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#8FC52A]">Ready when you are</p>
              <h2 className="mb-4 font-serif text-[clamp(36px,4.5vw,52px)] leading-[1.1] tracking-tight text-white" style={{ fontFamily: "var(--font-serif)" }}>
                Post your role today.
                <br />
                <em className="italic text-[#8FC52A]">Get applies by Friday.</em>
              </h2>
              <p className="mb-8 text-[17px] text-white/75">Fifteen minutes to list. Eight hours to publish. Two weeks to hire.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  className="inline-flex h-[52px] items-center gap-2 rounded-12 bg-brand-600 px-7 text-[15px] font-medium text-white transition-colors hover:bg-brand-700"
                  to={ROUTES.postJob}
                >
                  Post a job — from $150 <ArrowRight size={16} />
                </Link>
                <a
                  className="inline-flex h-[52px] items-center px-7 text-[15px] font-medium text-white/70 transition-colors hover:text-white"
                  href="mailto:hello@remotesea.io"
                >
                  Talk to founder first
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
