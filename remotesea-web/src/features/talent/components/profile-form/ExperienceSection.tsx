import { SectionHead, EMPHASIS_STYLE } from "@/features/talent/components/profile-form/SectionHead";

// No work-history model exists in the backend yet (TalentProfile has no experience
// relation) — kept as illustrative static content, same as the source, until that
// feature exists server-side.
const SAMPLE_EXPERIENCE = [
  {
    initials: "FL",
    color: "#1F8A3A",
    company: "Finch Labs",
    flag: "🇸🇬",
    country: "Singapore",
    title: "Frontend Engineer",
    from: "May 2023",
    to: "Present",
    note: "Built the merchant onboarding flow for Finch's payment APIs. Owned the design system migration to Tailwind + Radix. React, TypeScript, Next.js.",
  },
  {
    initials: "CA",
    color: "#FF6D3B",
    company: "Carousell",
    flag: "🇸🇬",
    country: "Singapore",
    title: "Software Engineer",
    from: "Aug 2021",
    to: "Apr 2023",
    note: "Worked on the buyer-side checkout experience for the SG market. Shipped the offer-and-counteroffer feature used by 8M+ monthly users.",
  },
];

export const ExperienceSection = () => (
  <section className="rounded-20 scroll-mt-6 border border-neutral-100 bg-white p-7" id="experience">
    <SectionHead
      eyebrow="03 · Track record"
      help="Work history isn't backed by an API yet — shown here as a preview of the layout."
      title={
        <em className="font-serif italic text-brand-700" style={EMPHASIS_STYLE}>
          Experience.
        </em>
      }
    />
    <div className="divide-y divide-neutral-50">
      {SAMPLE_EXPERIENCE.map((exp) => (
        <div className="flex gap-4 py-4 first:pt-0" key={exp.company}>
          <div
            className="rounded-10 flex h-10 w-10 flex-shrink-0 items-center justify-center text-[13px] font-bold text-white"
            style={{ background: exp.color }}
          >
            {exp.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-neutral-900">
              {exp.title} <span className="font-normal text-neutral-500">at {exp.company}</span>
            </p>
            <p className="mb-1.5 flex items-center gap-1.5 text-[12px] text-neutral-400">
              <span>
                {exp.flag} {exp.country}
              </span>
              <span className="h-0.5 w-0.5 rounded-full bg-neutral-300" />
              <span className="font-mono">
                {exp.from} → {exp.to}
              </span>
            </p>
            <p className="text-[12.5px] leading-relaxed text-neutral-600">{exp.note}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);
