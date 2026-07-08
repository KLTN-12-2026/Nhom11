import type { UseFormRegister } from "react-hook-form";
import { SectionHead, EMPHASIS_STYLE } from "@/features/talent/components/profile-form/SectionHead";
import { SELECT_INPUT_CLASS } from "@/features/talent/components/profile-form/profile-form.constants";
import { SENIORITY_OPTIONS, YEARS_BUCKETS } from "@/features/talent/talent.constants";
import type { ProfileFormValues } from "@/features/talent/talent.schemas";

interface AboutSectionProps {
  register: UseFormRegister<ProfileFormValues>;
  bioError?: string;
  bioLength: number;
}

const MAX_BIO_LENGTH = 320;

export const AboutSection = ({ register, bioError, bioLength }: AboutSectionProps) => (
  <section className="rounded-20 scroll-mt-6 border border-neutral-100 bg-white p-7" id="about">
    <SectionHead
      eyebrow="02 · Story"
      help="A short, plain-English summary. No buzzwords — write like you'd describe yourself in an email."
      title={
        <>
          About{" "}
          <em className="font-serif italic text-brand-700" style={EMPHASIS_STYLE}>
            you.
          </em>
        </>
      }
    />
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[12.5px] font-medium text-neutral-700">
            Bio <span className="font-normal text-neutral-400">2–4 sentences</span>
          </label>
          <span className="text-[11px] text-neutral-400">
            {bioLength} / {MAX_BIO_LENGTH}
          </span>
        </div>
        <textarea
          className="rounded-10 focus:border-brand-500 w-full resize-none border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-100"
          rows={4}
          {...register("bio")}
        />
        {bioError && <p className="text-[11.5px] text-red-600">{bioError}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-[12.5px] font-medium text-neutral-700">Seniority</label>
          <select className={SELECT_INPUT_CLASS} {...register("seniority")}>
            {SENIORITY_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-[12.5px] font-medium text-neutral-700">Years of experience</label>
          <select className={SELECT_INPUT_CLASS} {...register("yearsBucket")}>
            {YEARS_BUCKETS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  </section>
);
