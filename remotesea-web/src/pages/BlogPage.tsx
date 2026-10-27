import { useState } from "react";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { PillToggle } from "@/components/shared/PillToggle";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const POSTS = [
  {
    id: "p1",
    featured: true,
    category: "Negotiation",
    title: "Why your offer is probably 22% too low — and the exact 4 sentences that fix it.",
    excerpt:
      "We analyzed 142 offers from Singaporean and Australian companies hiring Vietnamese talent. The gap between what's offered and what's possible is bigger than you think.",
    author: "Linh Nguyen",
    authorInitial: "L",
    authorColor: "linear-gradient(135deg,#2E9B52,#1F7A3D)",
    date: "Mar 12, 2026",
    readTime: "9 min",
    accent: "#2E9B52",
    bg: "linear-gradient(135deg, #2E9B52 0%, #0D3D1F 100%)",
  },
  {
    id: "p2",
    category: "Async Work",
    title: "The 5pm shutdown ritual that saved my marriage (and my Loom usage).",
    excerpt:
      "Working with a Sydney team meant my Slack stayed warm until 11pm. Here's the boundary system that actually held.",
    author: "Minh Trần",
    authorInitial: "M",
    authorColor: "linear-gradient(135deg,#F59E0B,#B45309)",
    date: "Mar 08, 2026",
    readTime: "6 min",
    accent: "#B45309",
    bg: "linear-gradient(140deg, #FCD34D 0%, #B45309 100%)",
  },
  {
    id: "p3",
    category: "Salary",
    title: "What 612 remote offers told us about senior frontend pay.",
    excerpt: "Median: $4,800. Top decile: $7,200+. The full breakdown by company size, country, and seniority.",
    author: "Hà Phạm",
    authorInitial: "H",
    authorColor: "linear-gradient(135deg,#2563EB,#1D4ED8)",
    date: "Mar 04, 2026",
    readTime: "11 min",
    accent: "#2563EB",
    bg: "linear-gradient(135deg, #1F8A5B 0%, #16766F 100%)",
  },
  {
    id: "p4",
    category: "Interview",
    title: "I bombed 7 Stripe-loop interviews. Then I figured out the system.",
    excerpt: "The system design rounds at top-tier companies follow a pattern. Memorize the pattern, ace the round.",
    author: "Khang Lê",
    authorInitial: "K",
    authorColor: "linear-gradient(135deg,#7C3AED,#5B21B6)",
    date: "Feb 28, 2026",
    readTime: "12 min",
    accent: "#7C3AED",
    bg: "linear-gradient(135deg, #5B21B6 0%, #1E1B4B 100%)",
  },
  {
    id: "p5",
    category: "Career",
    title: "Why I left a 6-figure FAANG offer to join a 22-person SG startup.",
    excerpt:
      "On paper it looked nuts. In practice, the equity math, the learning curve, and the timezone alignment made it the obvious move.",
    author: "Tâm Đặng",
    authorInitial: "T",
    authorColor: "linear-gradient(135deg,#0EA5E9,#0369A1)",
    date: "Feb 22, 2026",
    readTime: "8 min",
    accent: "#0EA5E9",
    bg: "linear-gradient(135deg, #0EA5E9 0%, #0C4A6E 100%)",
  },
  {
    id: "p6",
    category: "Async Work",
    title: "Standups are dead, long live the Friday roll-up.",
    excerpt: "How three of our members run weekly written async updates instead of 5 standups. Saves 4hr/week per engineer.",
    author: "Phương Vũ",
    authorInitial: "P",
    authorColor: "linear-gradient(135deg,#65A30D,#3F6212)",
    date: "Feb 18, 2026",
    readTime: "5 min",
    accent: "#65A30D",
    bg: "linear-gradient(135deg, #65A30D 0%, #1A2E05 100%)",
  },
  {
    id: "p7",
    category: "Salary",
    title: "Equity, RSUs, options — a Vietnamese employee's tax guide.",
    excerpt:
      "Written with a Singapore-based tax lawyer. What you actually owe, what you actually keep, and the 3 mistakes everyone makes.",
    author: "Quân Lý",
    authorInitial: "Q",
    authorColor: "linear-gradient(135deg,#DC2626,#7F1D1D)",
    date: "Feb 14, 2026",
    readTime: "14 min",
    accent: "#DC2626",
    bg: "linear-gradient(135deg, #DC2626 0%, #450A0A 100%)",
  },
  {
    id: "p8",
    category: "Tools",
    title: "My async stack: Notion + Linear + Loom, and the glue between them.",
    excerpt: "How I run product design for a remote-first team across 6 timezones with three tools and a Friday ritual.",
    author: "Sương Bùi",
    authorInitial: "S",
    authorColor: "linear-gradient(135deg,#16766F,#134E4A)",
    date: "Feb 09, 2026",
    readTime: "7 min",
    accent: "#16766F",
    bg: "linear-gradient(135deg, #16766F 0%, #042F2E 100%)",
  },
];

const POPULAR = [
  "The Vietnamese remote worker's guide to Singapore tax residency",
  "How to write a CV that gets past Atlassian's ATS in 2026",
  "Loom is broken — what design teams use instead",
  "Async standups: the exact template our 8-person team uses",
];

const CATEGORIES = ["All", "Negotiation", "Salary", "Async Work", "Interview", "Career", "Tools"];

export const BlogPage = () => {
  useDocumentTitle("Field Notes — RemoteSEA Blog");
  const [activeCat, setActiveCat] = useState("All");

  const featured = POSTS.find((p) => p.featured) ?? POSTS[0];
  const rest = POSTS.filter((p) => !p.featured);
  const filtered = activeCat === "All" ? rest : rest.filter((p) => p.category === activeCat);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-100 bg-white py-16">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-100 bg-white px-3 py-1.5 text-[13px] text-neutral-500 shadow-[0_1px_2px_rgba(26,25,23,0.06)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-600" />
            Field notes · published Tue + Fri
          </div>
          <h1 className="mb-3 max-w-2xl text-[44px] font-semibold leading-[1.1] tracking-tight text-neutral-900 lg:text-[52px]">
            Field notes from{" "}
            <em className="font-serif text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
              remote work
            </em>
            , written by the people doing it.
          </h1>
          <p className="mb-10 max-w-xl text-[17px] leading-relaxed text-neutral-500">
            No SEO sludge, no &ldquo;10 tips for productivity.&rdquo; Just honest essays on
            negotiation, async culture, timezone math, and tax law — written by Vietnamese
            professionals working for companies abroad.
          </p>

          {/* Featured */}
          <article className="rounded-20 grid gap-8 overflow-hidden border border-neutral-100 bg-white shadow-card transition-shadow hover:shadow-[0_4px_24px_rgba(26,25,23,0.10)] lg:grid-cols-[420px_1fr]">
            <div className="rounded-l-20 overflow-hidden">
              <div className="h-full min-h-[260px] w-full" style={{ background: featured.bg, aspectRatio: "4/3" }} />
            </div>
            <div className="flex flex-col justify-center p-8">
              <div className="mb-3 flex items-center gap-2 text-[13px] text-neutral-400">
                <span className="font-semibold" style={{ color: featured.accent }}>
                  {featured.category}
                </span>
                <span>·</span>
                <span>{featured.date}</span>
                <span>·</span>
                <span>{featured.readTime} read</span>
              </div>
              <h2 className="mb-3 text-[22px] font-semibold leading-snug text-neutral-900">{featured.title}</h2>
              <p className="mb-6 text-[14px] leading-relaxed text-neutral-500">{featured.excerpt}</p>
              <div className="flex items-center gap-3">
                <div
                  className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                  style={{ background: featured.authorColor }}
                >
                  {featured.authorInitial}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-neutral-900">{featured.author}</div>
                  <div className="text-[12px] text-neutral-400">Senior FE · 7yrs remote</div>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 text-[13px] font-medium text-brand-600">
                  Read essay <ArrowUpRight size={14} />
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Archive */}
      <section className="py-16">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Recent</p>
              <h2 className="text-[28px] font-semibold text-neutral-900">
                The{" "}
                <em className="font-serif text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
                  archive
                </em>
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <PillToggle
                  active={activeCat === c}
                  activeClassName="bg-brand-600 text-white"
                  className="px-3.5 py-1.5 text-[13px] font-medium transition-all"
                  inactiveClassName="border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                  key={c}
                  onClick={() => setActiveCat(c)}
                >
                  {c}
                </PillToggle>
              ))}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            {/* Grid */}
            <div className="grid gap-5 sm:grid-cols-2">
              {filtered.map((p) => (
                <article
                  className="group overflow-hidden rounded-16 border border-neutral-100 bg-white shadow-card transition-shadow hover:shadow-[0_4px_20px_rgba(26,25,23,0.08)]"
                  key={p.id}
                >
                  <div className="h-40 w-full" style={{ background: p.bg, aspectRatio: "16/10" }} />
                  <div className="p-5">
                    <div className="mb-2 flex items-center gap-2 text-[12px] text-neutral-400">
                      <span className="font-semibold" style={{ color: p.accent }}>
                        {p.category}
                      </span>
                      <span>·</span>
                      <span>{p.readTime}</span>
                    </div>
                    <h3 className="mb-2 text-[15px] font-semibold leading-snug text-neutral-900">{p.title}</h3>
                    <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-neutral-500">{p.excerpt}</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
                        style={{ background: p.authorColor }}
                      >
                        {p.authorInitial}
                      </div>
                      <div>
                        <div className="text-[12.5px] font-semibold text-neutral-900">{p.author}</div>
                        <div className="text-[11px] text-neutral-400">{p.date}</div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Aside */}
            <aside className="space-y-5">
              <div className="rounded-16 border border-neutral-100 bg-white p-5">
                <h4 className="mb-4 text-[13px] font-semibold uppercase tracking-widest text-neutral-400">
                  Most read this month
                </h4>
                <ol className="space-y-4">
                  {POPULAR.map((t, i) => (
                    <li className="flex items-start gap-3" key={t}>
                      <span className="flex-shrink-0 font-mono text-[11px] font-semibold text-brand-600">
                        0{i + 1}
                      </span>
                      <span className="text-[13px] leading-snug text-neutral-700">{t}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-16 border border-brand-100 bg-brand-50 p-5">
                <h4 className="mb-1 text-[15px] font-semibold text-neutral-900">Field notes, in your inbox.</h4>
                <p className="mb-4 text-[13px] text-neutral-500">
                  One essay every Tuesday. Honest, unpolished, no sponsors.
                </p>
                <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
                  <input
                    className="rounded-10 h-10 w-full border border-neutral-200 bg-white px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-brand-600"
                    placeholder="you@work.com"
                    type="email"
                  />
                  <button className="rounded-10 h-10 w-full bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700">
                    Subscribe
                  </button>
                </form>
                <p className="mt-3 text-[11px] text-neutral-400">Joining 2,400+ readers · unsubscribe anytime</p>
              </div>

              <div className="rounded-16 border border-neutral-100 bg-white p-5">
                <h4 className="mb-2 text-[13px] font-semibold uppercase tracking-widest text-neutral-400">
                  Write for us
                </h4>
                <p className="mb-3 text-[13px] leading-relaxed text-neutral-600">
                  If you&apos;ve negotiated a tough offer, navigated a hard timezone, or built an async
                  ritual that works — we&apos;d love your story.
                </p>
                <a
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  Pitch a piece <ArrowUpRight size={12} />
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Newsletter footer */}
      <section className="border-t border-neutral-100 bg-white py-16">
        <div className="mx-auto max-w-[640px] px-6 text-center">
          <h2 className="mb-3 text-[32px] font-semibold text-neutral-900">
            Get the next{" "}
            <em className="font-serif text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
              essay
            </em>
            , before it hits the site.
          </h2>
          <p className="mb-8 text-[15px] leading-relaxed text-neutral-500">
            One thoughtful piece every Tuesday morning, written by working remote professionals. No
            marketing tricks, no &ldquo;tools we love&rdquo; affiliate roundups.
          </p>
          <form className="flex flex-col gap-3 sm:flex-row sm:justify-center" onSubmit={(e) => e.preventDefault()}>
            <input
              className="h-12 flex-1 rounded-12 border border-neutral-200 bg-white px-4 text-sm outline-none placeholder:text-neutral-400 focus:border-brand-600 sm:max-w-xs"
              placeholder="you@work.com"
              type="email"
            />
            <button className="inline-flex h-12 items-center gap-2 rounded-12 bg-brand-600 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-700">
              Subscribe <ArrowRight size={14} />
            </button>
          </form>
          <p className="mt-4 text-[12px] text-neutral-400">
            2,400 readers · unsubscribe with one click · we don&apos;t sell emails, ever.
          </p>
        </div>
      </section>
    </>
  );
};
