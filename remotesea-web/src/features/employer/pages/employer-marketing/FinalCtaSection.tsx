import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export const FinalCtaSection = () => (
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
);
