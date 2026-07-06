import { Fragment } from "react";
import { ArrowRight } from "lucide-react";

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

const LAST_STEP_INDEX = PROCESS.length - 1;

export const ProcessSection = () => (
  <section className="border-y border-neutral-100 bg-white py-20">
    <div className="mx-auto max-w-[1240px] px-6">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">The process</p>
      <h2 className="mb-10 text-[32px] font-semibold tracking-tight text-neutral-900">
        List → review →{" "}
        <em className="font-serif-italic text-brand-700">
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
            {i < LAST_STEP_INDEX && (
              <div className="hidden place-items-center px-2 text-neutral-300 md:grid">
                <ArrowRight size={20} />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  </section>
);
