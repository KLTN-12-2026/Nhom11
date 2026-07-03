import { Check } from "lucide-react";
import { cn } from "@/utils/cn";
import { TIERS, type PostJobFormState } from "@/features/post-job/post-job.schemas";

export function StepPlan({
  form,
  set,
}: {
  form: PostJobFormState;
  set: (k: keyof PostJobFormState, v: unknown) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[22px] font-semibold text-neutral-900">Choose a plan</h2>
        <p className="mt-1 text-sm text-neutral-500">
          All plans include a public listing. Upgrade for more reach.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {TIERS.map((t) => (
          <button
            className={cn(
              "relative rounded-20 border p-5 text-left transition-all",
              form.tier === t.id
                ? "border-brand-600 bg-brand-50 shadow-card"
                : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-card"
            )}
            key={t.id}
            type="button"
            onClick={() => set("tier", t.id)}
          >
            {t.ribbon && (
              <span className="absolute -top-2.5 right-4 rounded-full bg-brand-600 px-2.5 py-0.5 text-[10.5px] font-bold text-white">
                {t.ribbon}
              </span>
            )}
            {form.tier === t.id && (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                <Check size={11} />
              </span>
            )}
            <p className="mb-1 text-[15px] font-semibold text-neutral-900">{t.name}</p>
            <p className="mb-3 text-[22px] font-semibold text-neutral-900">
              ${t.price}
              <span className="ml-0.5 text-[13px] font-normal text-neutral-400">one-time</span>
            </p>
            <p className="mb-3 text-[12.5px] leading-relaxed text-neutral-500">{t.desc}</p>
            <ul className="space-y-1.5">
              {t.features.map((f) => (
                <li className="flex items-center gap-2 text-[12px] text-neutral-600" key={f}>
                  <Check className="flex-shrink-0 text-brand-600" size={11} />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );
}
