const CASE_STUDY_STATS = [
  { num: "11 days", label: "List to offer" },
  { num: "42", label: "Total applies" },
  { num: "6", label: "Interviewed" },
  { num: "$3.5k", label: "Final offer/mo" },
];

export const CaseStudySection = () => (
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
              {CASE_STUDY_STATS.map((stat) => (
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
);
