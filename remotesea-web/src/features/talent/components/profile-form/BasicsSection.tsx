import type { UseFormRegister } from "react-hook-form";
import { SectionHead, EMPHASIS_STYLE } from "@/features/talent/components/profile-form/SectionHead";
import { SELECT_INPUT_CLASS, TEXT_INPUT_CLASS } from "@/features/talent/components/profile-form/profile-form.constants";
import { TIMEZONE_OPTIONS } from "@/features/talent/talent.constants";
import type { ProfileFormValues } from "@/features/talent/talent.schemas";

interface BasicsSectionProps {
  register: UseFormRegister<ProfileFormValues>;
  nameError?: string;
  headlineError?: string;
  headlineLength: number;
}

const MAX_HEADLINE_LENGTH = 80;

export const BasicsSection = ({ register, nameError, headlineError, headlineLength }: BasicsSectionProps) => (
  <section className="rounded-20 scroll-mt-6 border border-neutral-100 bg-white p-7" id="basics">
    <SectionHead
      eyebrow="01 · Identity"
      help="Your name, headline, location and timezone. This appears at the top of your profile."
      title={
        <>
          The{" "}
          <em className="font-serif italic text-brand-700" style={EMPHASIS_STYLE}>
            basics.
          </em>
        </>
      }
    />
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label className="block text-[12.5px] font-medium text-neutral-700" htmlFor="p-name">
          Full name
        </label>
        <input className={TEXT_INPUT_CLASS} id="p-name" {...register("name")} />
        {nameError && <p className="text-[11.5px] text-red-600">{nameError}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="block text-[12.5px] font-medium text-neutral-700" htmlFor="p-pronouns">
          Pronouns <span className="font-normal text-neutral-400">(optional)</span>
        </label>
        <input className={TEXT_INPUT_CLASS} disabled id="p-pronouns" placeholder="Not tracked yet" />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <div className="flex items-center justify-between">
          <label className="block text-[12.5px] font-medium text-neutral-700">Headline</label>
          <span className="text-[11px] text-neutral-400">
            {headlineLength} / {MAX_HEADLINE_LENGTH}
          </span>
        </div>
        <input
          className={TEXT_INPUT_CLASS}
          placeholder="Role · timezone · standout signal"
          {...register("headline")}
        />
        {headlineError && <p className="text-[11.5px] text-red-600">{headlineError}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="block text-[12.5px] font-medium text-neutral-700" htmlFor="p-loc">
          Where are you based?
        </label>
        <input className={TEXT_INPUT_CLASS} id="p-loc" {...register("location")} />
      </div>
      <div className="space-y-1.5">
        <label className="block text-[12.5px] font-medium text-neutral-700" htmlFor="p-tz">
          Working timezone
        </label>
        <select className={SELECT_INPUT_CLASS} id="p-tz" {...register("timezone")}>
          {TIMEZONE_OPTIONS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
    </div>
  </section>
);
