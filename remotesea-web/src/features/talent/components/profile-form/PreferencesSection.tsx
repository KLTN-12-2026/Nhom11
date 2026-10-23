import { SectionHead, EMPHASIS_STYLE } from "@/features/talent/components/profile-form/SectionHead";

const SALARY_MIN = 1000;
const SALARY_MAX = 10000;
const SALARY_STEP = 100;
const SALARY_GAP = 200;

interface PreferencesSectionProps {
  salMin: number;
  salMax: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
}

export const PreferencesSection = ({ salMin, salMax, onMinChange, onMaxChange }: PreferencesSectionProps) => (
  <section className="rounded-20 scroll-mt-6 border border-neutral-100 bg-white p-7" id="prefs">
    <SectionHead
      eyebrow="05 · What you want"
      help="Your salary expectation. Only shown to employers if you're open to work."
      title={
        <>
          Job{" "}
          <em className="font-serif italic text-brand-700" style={EMPHASIS_STYLE}>
            preferences.
          </em>
        </>
      }
    />
    <div className="rounded-16 border border-neutral-100 bg-neutral-50 p-5">
      <div className="mb-1 flex items-center justify-between">
        <label className="text-[13px] font-medium text-neutral-700">Salary expectation</label>
        <span className="text-[11.5px] text-neutral-400">Visible only if open to work</span>
      </div>
      <p className="mb-4 text-[24px] font-semibold tracking-tight text-neutral-900">
        ${salMin.toLocaleString()}–{salMax.toLocaleString()}
        <span className="ml-1 text-[14px] font-normal text-neutral-400">USD / month</span>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[11px] text-neutral-400">Minimum</p>
          <input
            className="w-full accent-brand-600"
            max={SALARY_MAX}
            min={SALARY_MIN}
            step={SALARY_STEP}
            type="range"
            value={salMin}
            onChange={(e) => onMinChange(Math.min(Number(e.target.value), salMax - SALARY_GAP))}
          />
        </div>
        <div>
          <p className="mb-1 text-[11px] text-neutral-400">Maximum</p>
          <input
            className="w-full accent-brand-600"
            max={SALARY_MAX}
            min={SALARY_MIN}
            step={SALARY_STEP}
            type="range"
            value={salMax}
            onChange={(e) => onMaxChange(Math.max(Number(e.target.value), salMin + SALARY_GAP))}
          />
        </div>
      </div>
    </div>
  </section>
);
