import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { ROUTES } from "@/constants/routes";

const TIERS = [
  {
    name: "Standard",
    tag: "For one-off roles",
    price: 150,
    annualPrice: 1500,
    desc: "A clean 30-day listing on the board.",
    featured: false,
    features: [
      "30-day active listing",
      "Verified employer badge",
      "Application inbox",
      "Email when new applies",
      "Renewable at 50% off",
    ],
  },
  {
    name: "Featured",
    tag: "Most popular",
    price: 350,
    annualPrice: 3500,
    desc: "Front of the queue, amber highlight, alerts to subscribers.",
    featured: true,
    features: [
      "Everything in Standard",
      "Top-of-feed placement",
      "Amber-border highlight",
      "Weekly newsletter inclusion",
      "2× more applies on average",
    ],
  },
  {
    name: "Hands-on",
    tag: "We do the work",
    price: 1200,
    annualPrice: null as number | null,
    desc: "We screen the applicants. You see the top 5.",
    featured: false,
    features: [
      "Everything in Featured",
      "Founder-led screening",
      "1:1 candidate interviews",
      "Reference checks done for you",
      "Shortlist delivered in 10 days",
    ],
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Pricing
          </p>
          <h2 className="text-[36px] font-semibold tracking-tight text-neutral-900">
            One-time, not{" "}
            <em className="font-serif italic text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
              subscription.
            </em>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-neutral-500">
            No &quot;talent network access fees.&quot; No seats. Pay per role, only when you&apos;re hiring.
          </p>
        </div>

        <div className="mb-10 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 p-1">
            <button
              className={`rounded-full px-5 py-2 text-[13.5px] font-medium transition-all ${
                !annual ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
              }`}
              onClick={() => setAnnual(false)}
            >
              Per role
            </button>
            <button
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-[13.5px] font-medium transition-all ${
                annual ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
              }`}
              onClick={() => setAnnual(true)}
            >
              Annual
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-semibold text-brand-700">
                save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              className={`relative flex flex-col rounded-24 border p-7 ${
                tier.featured
                  ? "border-brand-600 bg-gradient-to-b from-brand-50 to-white shadow-card-lg"
                  : "border-neutral-100 bg-white"
              }`}
              key={tier.name}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  Most popular
                </div>
              )}

              <div className="mb-1 text-[16px] font-semibold text-neutral-900">{tier.name}</div>
              <div className="mb-4 text-[12.5px] text-neutral-400">{tier.tag}</div>

              <div className="mb-3 font-serif text-[48px] leading-none tracking-tight text-neutral-900" style={{ fontFamily: "var(--font-serif)" }}>
                {annual && tier.annualPrice ? (
                  <>
                    ${tier.annualPrice.toLocaleString()}
                    <span className="ml-1 font-sans text-[16px] text-neutral-400">/yr</span>
                  </>
                ) : annual && !tier.annualPrice ? (
                  <span className="text-[32px] italic">Quote</span>
                ) : (
                  <>
                    ${tier.price.toLocaleString()}
                    <span className="ml-1 font-sans text-[16px] text-neutral-400">/post</span>
                  </>
                )}
              </div>

              <p className="mb-5 min-h-[42px] text-[13.5px] leading-relaxed text-neutral-500">{tier.desc}</p>

              {tier.name === "Hands-on" ? (
                <a
                  className="mb-6 flex w-full items-center justify-center gap-2 rounded-12 border border-neutral-200 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                  href="mailto:hello@remotesea.io"
                >
                  Talk to us <ArrowRight size={14} />
                </a>
              ) : (
                <Link
                  className={`mb-6 flex w-full items-center justify-center gap-2 rounded-12 py-3 text-sm font-medium transition-colors ${
                    tier.featured
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                  }`}
                  to={ROUTES.postJob}
                >
                  Get started <ArrowRight size={14} />
                </Link>
              )}

              <ul className="space-y-2.5 border-t border-neutral-100 pt-5">
                {tier.features.map((f) => (
                  <li className="flex items-start gap-2.5 text-[13.5px] text-neutral-700" key={f}>
                    <span className="mt-0.5 grid h-4 w-4 flex-shrink-0 place-items-center rounded-full bg-brand-50">
                      <Check className="text-brand-600" size={10} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-5 py-3 text-[13.5px] text-brand-700">
            <Check size={15} />
            30-day money-back guarantee. Qualified applications or full refund.
          </div>
        </div>
      </div>
    </section>
  );
}
