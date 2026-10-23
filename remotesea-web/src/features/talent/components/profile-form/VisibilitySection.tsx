import { ShieldCheck } from "lucide-react";
import { SectionHead, EMPHASIS_STYLE } from "@/features/talent/components/profile-form/SectionHead";
import { Toggle } from "@/features/talent/components/profile-form/Toggle";

interface VisibilitySectionProps {
  isOpenToWork: boolean;
  onToggle: (value: boolean) => void;
}

export const VisibilitySection = ({ isOpenToWork, onToggle }: VisibilitySectionProps) => (
  <section className="rounded-20 scroll-mt-6 border border-neutral-100 bg-white p-7" id="visibility">
    <SectionHead
      eyebrow="07 · Who sees you"
      help="Employers can only find and contact you while you're open to work."
      title={
        <em className="font-serif italic text-brand-700" style={EMPHASIS_STYLE}>
          Visibility.
        </em>
      }
    />
    <div className="flex items-center justify-between rounded-16 border border-neutral-200 bg-white px-4 py-4">
      <div>
        <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-neutral-900">
          <ShieldCheck className={isOpenToWork ? "text-brand-600" : "text-neutral-400"} size={14} />
          Open to work
        </p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">
          {isOpenToWork
            ? "Your profile and salary expectation are visible to employers."
            : "Your profile is hidden and your salary expectation is not shown."}
        </p>
      </div>
      <Toggle on={isOpenToWork} onChange={onToggle} />
    </div>
  </section>
);
