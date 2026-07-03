import { useState } from "react";
import { Minus, Plus } from "lucide-react";

const ITEMS = [
  {
    q: "What does 'verified employer' actually mean?",
    a: "A real human at RemoteSEA (currently: the founder) checks your company website, LinkedIn, hiring page, and at least one team member. We confirm the role is open, the team exists, and the comp range is honest. Takes 4–8 working hours.",
  },
  {
    q: "Why do you require a salary range?",
    a: "Because hiding the range wastes everyone's time. Candidates who would never accept your max apply anyway; candidates who'd love your role skip you because they assumed the worst. We've published 200+ jobs with ranges — the data shows applications go up, not down.",
  },
  {
    q: "Can I post a role that pays in VND?",
    a: "Yes, but the listing must convert to USD/month for comparison (we'll help). VN talent comparing your role against SG roles needs a like-for-like number. We do this automatically.",
  },
  {
    q: "What if I want to hire as a contractor, not FTE?",
    a: "Totally fine. ~30% of our roles are contract. We don't take a cut of payments or require you to use a specific EOR — you handle that side. Wise, Deel, and direct wire are all common.",
  },
  {
    q: "Do you charge candidates anything?",
    a: "No. Free for talent. Forever. Revenue comes from employer postings only.",
  },
  {
    q: "What if my listing doesn't work out?",
    a: "30-day money-back guarantee. If you don't receive a single qualified application (we'll judge fairly — qualified means meets your stated must-haves), you get a full refund. No questions.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number>(0);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-[760px] px-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">FAQ</p>
        <h2 className="mb-10 text-[32px] font-semibold tracking-tight text-neutral-900">
          Honest{" "}
          <em className="font-serif italic text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
            answers.
          </em>
        </h2>

        <div className="flex flex-col gap-2">
          {ITEMS.map((item, i) => (
            <div
              className={`rounded-12 border bg-white transition-colors ${
                open === i ? "border-neutral-200" : "border-neutral-100"
              }`}
              key={item.q}
            >
              <button
                className="flex w-full items-center justify-between gap-4 px-6 py-[18px] text-left"
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                <span className="text-[15px] font-medium tracking-tight text-neutral-900">{item.q}</span>
                {open === i ? (
                  <Minus className="flex-shrink-0 text-neutral-400" size={16} />
                ) : (
                  <Plus className="flex-shrink-0 text-neutral-400" size={16} />
                )}
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-[14.5px] leading-relaxed text-neutral-500">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
