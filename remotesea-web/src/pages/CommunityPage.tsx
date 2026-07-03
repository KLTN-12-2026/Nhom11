import { ArrowRight, MapPin, Briefcase, Users } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const MEMBERS = [
  {
    name: "Linh Nguyen",
    role: "Sr. Frontend Engineer",
    company: "Canva",
    city: "Đà Nẵng",
    years: 7,
    initial: "L",
    color: "linear-gradient(135deg,#2E9B52,#1F7A3D)",
    quote: "After two years, I finally figured out how to do deep work in PJs without losing my mind.",
  },
  {
    name: "Minh Trần",
    role: "Product Designer",
    company: "Linear",
    city: "TP. Hồ Chí Minh",
    years: 5,
    initial: "M",
    color: "linear-gradient(135deg,#F59E0B,#B45309)",
    quote: "The async culture here means my best work happens between 5–11pm. The team in SF doesn't blink.",
  },
  {
    name: "Hà Phạm",
    role: "Staff Engineer",
    company: "Cedar Co",
    city: "Hà Nội",
    years: 9,
    initial: "H",
    color: "linear-gradient(135deg,#2563EB,#1D4ED8)",
    quote: "Six timezones, zero standups. The PRs and docs do all the talking.",
  },
  {
    name: "Khang Lê",
    role: "Growth Marketer",
    company: "Carousell",
    city: "Đà Lạt",
    years: 4,
    initial: "K",
    color: "linear-gradient(135deg,#7C3AED,#5B21B6)",
    quote: "Living in a tea farm town. Working on growth across 5 SEA markets. Wild, honestly.",
  },
];

const CHANNELS = [
  { name: "introductions", topic: "New members say hi", count: 487, color: "#2E9B52" },
  { name: "offer-negotiations", topic: "Help with your counter", count: 142, color: "#B45309" },
  { name: "async-rituals", topic: "How teams actually work", count: 98, color: "#2563EB" },
  { name: "equity-explained", topic: "Stock options, RSUs, vesting", count: 76, color: "#1F7A3D" },
  { name: "parents-who-remote", topic: "WFH with kids around", count: 64, color: "#7C3AED" },
  { name: "coliving-da-nang", topic: "The unofficial HQ", count: 53, color: "#0EA5E9" },
];

const THREADS = [
  {
    channel: "#offer-negotiations",
    initial: "L",
    color: "linear-gradient(135deg,#2E9B52,#1F7A3D)",
    name: "Linh N.",
    time: "2h",
    text: "Just got an offer from a Series B in SG — $4.8k base, 0.08% equity at $80M valuation. Senior FE, 5 yoe. Feels low vs market? Anyone negotiated similar?",
    replies: 18,
    reactions: ["🤔", "💪", "🔥"],
  },
  {
    channel: "#async-rituals",
    initial: "M",
    color: "linear-gradient(135deg,#F59E0B,#B45309)",
    name: "Minh T.",
    time: "5h",
    text: "Anyone tried Loom for design crits in fully-async teams? My team in Sydney loves it but I find myself rewatching at 2x and missing the nuance. Tips welcome.",
    replies: 11,
    reactions: ["📹", "✨"],
  },
  {
    channel: "#coliving-da-nang",
    initial: "K",
    color: "linear-gradient(135deg,#7C3AED,#5B21B6)",
    name: "Khang L.",
    time: "1d",
    text: "Heads up — Hidden Bean in An Thượng has zero wifi today. Going to Surf Bar instead. Anyone else around for coworking 2–6pm?",
    replies: 7,
    reactions: ["☕", "🏄"],
  },
];

const EVENTS = [
  {
    title: "Remoteo meetup · Đà Nẵng",
    desc: "Monthly coworking + dinner. Coast-facing café. Bring a laptop or just yourself.",
    date: "Apr 06",
    day: "Sat",
    attendees: 32,
    city: "Đà Nẵng",
    color: "#2E9B52",
  },
  {
    title: "Async tooling teardown",
    desc: "Three folks share their full async stack — Notion, Linear, Loom, beyond. Lightning talks.",
    date: "Apr 11",
    day: "Thu",
    attendees: 64,
    city: "Online",
    color: "#2563EB",
  },
  {
    title: "Equity & options 101",
    desc: "Workshop with a tax lawyer from Singapore. RSUs, ISOs, double-trigger acceleration — the whole deal.",
    date: "Apr 18",
    day: "Thu",
    attendees: 41,
    city: "Online",
    color: "#B45309",
  },
  {
    title: "Founders & freelancers brunch",
    desc: "Hosted at Cộng Cafe, Ngô Đức Kế. For members building their own thing on the side or full-time.",
    date: "Apr 27",
    day: "Sat",
    attendees: 22,
    city: "TP.HCM",
    color: "#1F7A3D",
  },
];

const AVATAR_CLOUD = [
  { l: "L", c: "#2E9B52", x: 70, y: 8, s: 80 },
  { l: "M", c: "#F59E0B", x: 200, y: 38, s: 64 },
  { l: "H", c: "#2563EB", x: 32, y: 130, s: 70 },
  { l: "K", c: "#7C3AED", x: 154, y: 158, s: 88 },
  { l: "T", c: "#1F7A3D", x: 282, y: 130, s: 56 },
  { l: "P", c: "#0EA5E9", x: 88, y: 250, s: 60 },
  { l: "Đ", c: "#B45309", x: 220, y: 268, s: 72 },
  { l: "N", c: "#5C5954", x: 322, y: 240, s: 50 },
  { l: "V", c: "#16766F", x: 24, y: 330, s: 54 },
  { l: "S", c: "#DC2626", x: 168, y: 380, s: 64 },
  { l: "B", c: "#1D4ED8", x: 290, y: 360, s: 58 },
  { l: "Q", c: "#65A30D", x: 110, y: 70, s: 50 },
];

export function CommunityPage() {
  useDocumentTitle("Community — RemoteSEA");
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-100 bg-white py-20">
        <div className="mx-auto grid max-w-[1240px] items-center gap-16 px-6 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neutral-100 bg-white px-3 py-1.5 text-[13px] text-neutral-500 shadow-[0_1px_2px_rgba(26,25,23,0.06)]">
              <span className="h-2 w-2 rounded-full bg-brand-600" />
              Invite-only · 500+ members from 14 cities
            </div>
            <h1 className="mb-4 text-[44px] font-semibold leading-[1.1] tracking-tight text-neutral-900 lg:text-[52px]">
              500+ remote-working Vietnamese,{" "}
              <em className="font-serif text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
                one Slack
              </em>
              .
            </h1>
            <p className="mb-8 max-w-lg text-[17px] leading-relaxed text-neutral-500">
              Engineers, designers, marketers, ops people — all working remotely for companies
              abroad. We trade offer letters, debug async culture, and meet up in person when
              we&apos;re in the same city.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="inline-flex h-[52px] items-center gap-2 rounded-12 bg-brand-600 px-6 text-[15px] font-medium text-white transition-colors hover:bg-brand-700">
                Request an invite <ArrowRight size={16} />
              </button>
              <button className="inline-flex h-[52px] items-center gap-2 rounded-12 border border-neutral-200 bg-white px-6 text-[15px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50">
                Watch the tour (2 min)
              </button>
            </div>
            <p className="mt-5 text-[13px] text-neutral-400">
              Vetted by current members. We look for senior craft and good-faith participation — not
              vibes.
            </p>
          </div>

          {/* Avatar cloud */}
          <div className="hidden lg:block">
            <div className="relative h-[460px] w-[380px]">
              <svg aria-hidden="true" className="absolute inset-0 h-full w-full" height="460" width="380">
                <line stroke="#E5E5E3" strokeWidth="1" x1="110" x2="232" y1="48" y2="70" />
                <line stroke="#E5E5E3" strokeWidth="1" x1="232" x2="186" y1="70" y2="200" />
                <line stroke="#E5E5E3" strokeWidth="1" x1="186" x2="68" y1="200" y2="165" />
                <line stroke="#E5E5E3" strokeWidth="1" x1="186" x2="310" y1="200" y2="160" />
                <line stroke="#E5E5E3" strokeWidth="1" x1="186" x2="252" y1="200" y2="300" />
                <line stroke="#E5E5E3" strokeWidth="1" x1="186" x2="118" y1="200" y2="280" />
              </svg>
              {AVATAR_CLOUD.map((a, i) => (
                <div
                  className="absolute grid place-items-center rounded-full font-semibold text-white shadow-card"
                  key={i}
                  style={{ left: a.x, top: a.y, width: a.s, height: a.s, background: a.c, fontSize: a.s * 0.42 }}
                >
                  {a.l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-neutral-100 bg-white">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-6 px-6 py-10 md:grid-cols-5">
          {[
            { v: "512", l: "Members" },
            { v: "14", l: "Cities" },
            { v: "86%", l: "Senior+" },
            { v: "$3.4k", l: "Median offer" },
            { v: "28", l: "Meetups in 2025" },
          ].map((s) => (
            <div className="text-center" key={s.l}>
              <div className="text-[26px] font-semibold tracking-tight text-neutral-900">{s.v}</div>
              <div className="mt-0.5 text-[13px] text-neutral-400">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Member spotlight */}
      <section className="py-16">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Members</p>
            <h2 className="mb-3 text-[32px] font-semibold text-neutral-900">
              The people{" "}
              <em className="font-serif text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
                actually
              </em>{" "}
              in here.
            </h2>
            <p className="mx-auto max-w-lg text-neutral-500">
              A small slice of who you&apos;ll meet. Everyone&apos;s vetted, everyone&apos;s remote,
              everyone&apos;s working for a company outside Vietnam.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MEMBERS.map((m) => (
              <article className="rounded-16 border border-neutral-100 bg-white p-5 shadow-card" key={m.name}>
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full text-base font-semibold text-white"
                    style={{ background: m.color }}
                  >
                    {m.initial}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-neutral-900">{m.name}</div>
                    <div className="text-[12px] text-neutral-500">{m.role}</div>
                    <div className="text-[12px] text-neutral-400">@ {m.company}</div>
                  </div>
                </div>
                <p className="mb-4 text-[13px] italic leading-relaxed text-neutral-600">&ldquo;{m.quote}&rdquo;</p>
                <div className="flex flex-wrap gap-3 text-[12px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {m.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase size={11} /> {m.years} years remote
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Channels & Threads */}
      <section className="pb-16">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Inside</p>
            <h2 className="mb-3 text-[32px] font-semibold text-neutral-900">
              What people{" "}
              <em className="font-serif text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
                actually
              </em>{" "}
              talk about.
            </h2>
            <p className="mx-auto max-w-lg text-neutral-500">
              A peek at the channels and a few threads from this week. Names redacted out of respect —
              when you join, the full archive is yours.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            {/* Channels list */}
            <div className="rounded-16 border border-neutral-100 bg-white p-4">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                Channels
              </div>
              <div className="space-y-1">
                {CHANNELS.map((ch) => (
                  <div className="rounded-10 flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-neutral-50" key={ch.name}>
                    <span className="text-[15px] font-bold" style={{ color: ch.color }}>
                      #
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-neutral-800">{ch.name}</div>
                      <div className="text-[11px] text-neutral-400">{ch.topic}</div>
                    </div>
                    <span className="flex-shrink-0 font-mono text-[11px] text-neutral-400">{ch.count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 px-3 text-[12px] text-neutral-400">+ 24 more</div>
            </div>

            {/* Threads */}
            <div className="space-y-4">
              {THREADS.map((t, i) => (
                <article className="rounded-16 border border-neutral-100 bg-white p-5 shadow-card" key={i}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <div
                      className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                      style={{ background: t.color }}
                    >
                      {t.initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[13px] font-semibold text-neutral-900">{t.name}</span>
                      <span className="mx-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
                        {t.channel}
                      </span>
                      <span className="text-[12px] text-neutral-400">{t.time}</span>
                    </div>
                  </div>
                  <p className="mb-3 text-[14px] leading-relaxed text-neutral-700">{t.text}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {t.reactions.map((r) => (
                        <span className="rounded-full border border-neutral-100 bg-neutral-50 px-2 py-0.5 text-sm" key={r}>
                          {r}
                        </span>
                      ))}
                    </div>
                    <span className="flex items-center gap-1 text-[12px] text-neutral-400">
                      <Users size={12} /> {t.replies} replies
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Meetups */}
      <section className="bg-neutral-900 py-16">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">In person</p>
            <h2 className="mb-3 text-[32px] font-semibold text-white">
              Coffee, beers, &amp;{" "}
              <em className="font-serif text-brand-400" style={{ fontFamily: "var(--font-serif)" }}>
                offline
              </em>{" "}
              bandwidth.
            </h2>
            <p className="mx-auto max-w-lg text-neutral-400">
              Members organize meetups whenever 5+ folks are in the same city. Free, low-key, and the
              wifi is always passable.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EVENTS.map((e, i) => (
              <article className="flex gap-4 rounded-16 border border-neutral-700 bg-neutral-800 p-5" key={i}>
                <div
                  className="rounded-10 flex w-14 flex-shrink-0 flex-col items-center border-t-2 bg-neutral-700 pt-2"
                  style={{ borderColor: e.color }}
                >
                  <span className="text-[10px] font-semibold uppercase text-neutral-400">
                    {e.date.split(" ")[0]}
                  </span>
                  <span className="text-[22px] font-semibold text-white">{e.date.split(" ")[1]}</span>
                  <span className="text-[10px] text-neutral-400">{e.day}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-1 text-[11px] text-neutral-400">
                    <MapPin size={10} /> {e.city}
                  </div>
                  <h4 className="mb-1.5 text-[14px] font-semibold text-white">{e.title}</h4>
                  <p className="mb-3 text-[12px] leading-relaxed text-neutral-400">{e.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map((j) => (
                        <span
                          className="h-5 w-5 rounded-full border border-neutral-800"
                          key={j}
                          style={{ background: `hsl(${(i + j) * 60}, 50%, 50%)` }}
                        />
                      ))}
                      <span className="ml-1 text-[11px] text-neutral-400">{e.attendees} going</span>
                    </div>
                    <button className="text-[12px] font-medium transition-colors" style={{ color: e.color }}>
                      RSVP →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-[720px] px-6 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Apply</p>
          <h2 className="mb-4 text-[36px] font-semibold text-neutral-900">
            Ready to join the{" "}
            <em className="font-serif text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
              family
            </em>
            ?
          </h2>
          <p className="mb-10 text-[15px] leading-relaxed text-neutral-500">
            One form, 4 questions, ~5 minutes. We review applications every Friday and reply by the
            following Tuesday — yes, even if the answer is &ldquo;not yet.&rdquo;
          </p>
          <div className="mb-10 grid gap-6 text-left sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "Apply",
                desc: "4 questions about your role, time zone, and what you'd contribute.",
              },
              {
                num: "02",
                title: "Reviewed Fridays",
                desc: "Two existing members read each application. ~5% rejection rate.",
              },
              {
                num: "03",
                title: "Welcome thread",
                desc: "Intro yourself in #introductions. Lurk or contribute — both are fine.",
              },
            ].map((s) => (
              <div className="flex gap-4" key={s.num}>
                <span className="mt-0.5 flex-shrink-0 font-mono text-[13px] font-semibold text-brand-600">
                  {s.num}
                </span>
                <div>
                  <div className="mb-1 text-[15px] font-semibold text-neutral-900">{s.title}</div>
                  <div className="text-[13px] text-neutral-500">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button className="inline-flex h-[52px] items-center gap-2 rounded-12 bg-brand-600 px-6 text-[15px] font-medium text-white transition-colors hover:bg-brand-700">
              Request invite <ArrowRight size={16} />
            </button>
            <button className="inline-flex h-[52px] items-center gap-2 rounded-12 border border-neutral-200 bg-white px-6 text-[15px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50">
              Read the code of conduct
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
