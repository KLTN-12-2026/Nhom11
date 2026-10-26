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

export const WhySection = () => (
  <section className="py-20">
    <div className="mx-auto max-w-[1240px] px-6">
      <div className="mb-12 text-center">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Why post here</p>
        <h2 className="text-[36px] font-semibold tracking-tight text-neutral-900">
          Smaller pool.{" "}
          <em className="font-serif-italic text-brand-700">
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
);
