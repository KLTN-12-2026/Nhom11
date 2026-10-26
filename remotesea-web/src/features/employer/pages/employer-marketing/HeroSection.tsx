import { Link } from "react-router-dom";
import { ArrowRight, Building2, ShieldCheck } from "lucide-react";

const APPLICANTS = [
  { name: "Phạm Tuấn", role: "Sr. Frontend · 6 yrs", loc: "Đà Nẵng, VN", match: 94 },
  { name: "Nguyễn Anh", role: "Frontend / Design Eng · 5 yrs", loc: "Hà Nội, VN", match: 88 },
  { name: "Lê Hoàng", role: "Sr. Frontend · 7 yrs", loc: "TP.HCM, VN", match: 82 },
];

const DASHBOARD_STATS = [
  { num: "142", label: "Views", bars: [3, 5, 4, 6, 8, 7, 9, 11, 10, 14], color: "bg-brand-600" },
  { num: "28", label: "Applications", bars: [1, 2, 2, 3, 3, 4, 5, 4, 6, 8], color: "bg-amber-400" },
  { num: "7", label: "Shortlisted", bars: [0, 0, 1, 1, 2, 2, 3, 4, 5, 7], color: "bg-blue-400" },
];

const BAR_HEIGHT_SCALE = 2;
const MIN_BAR_HEIGHT = 4;
const HIGH_MATCH_THRESHOLD = 90;

export const HeroSection = () => (
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
            {DASHBOARD_STATS.map((stat) => (
              <div className="flex flex-col gap-1 rounded-12 bg-neutral-50 p-3" key={stat.label}>
                <div className="font-serif text-[28px] leading-none tracking-tight text-neutral-900" style={{ fontFamily: "var(--font-serif)" }}>
                  {stat.num}
                </div>
                <div className="text-[10.5px] font-medium uppercase tracking-widest text-neutral-400">{stat.label}</div>
                <div className="mt-1.5 flex h-7 items-end gap-0.5">
                  {stat.bars.map((h, i) => (
                    <span className={`flex-1 rounded-sm opacity-65 ${stat.color}`} key={i} style={{ height: `${h * BAR_HEIGHT_SCALE}px`, minHeight: MIN_BAR_HEIGHT }} />
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
                <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${a.match > HIGH_MATCH_THRESHOLD ? "bg-brand-50 text-brand-700" : "bg-neutral-100 text-neutral-500"}`}>
                  {a.match}% match
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);
