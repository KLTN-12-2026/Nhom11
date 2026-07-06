import { Check } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/features/post-job/components/form-primitives";
import { SkillTagEditor } from "@/components/shared/SkillTagEditor";
import { useCategories } from "@/features/taxonomy/taxonomy.queries";
import { cn } from "@/utils/cn";
import {
  BENEFIT_OPTIONS,
  CURRENCY_OPTIONS,
  JOB_TYPE_LABELS,
  JOB_TYPE_OPTIONS,
  LOCATION_OPTIONS,
  PERIOD_OPTIONS,
  SENIORITY_OPTIONS,
  TIMEZONE_OPTIONS,
  type PostJobStepProps,
} from "@/features/post-job/post-job.schemas";

export const StepRole = ({ form, set }: PostJobStepProps) => {
  const { data: categories } = useCategories();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[22px] font-semibold text-neutral-900">Role details</h2>
        <p className="mt-1 text-sm text-neutral-500">Help candidates understand exactly what you need.</p>
      </div>

      <Field label="Job title">
        <Input
          placeholder="Senior Frontend Engineer"
          value={form.jobTitle}
          onChange={(v) => set("jobTitle", v)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Category">
          <Select
            options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
            value={form.jobCategoryId}
            onChange={(v) => set("jobCategoryId", v)}
          />
        </Field>
        <Field label="Seniority">
          <Select
            options={SENIORITY_OPTIONS.map((o) => ({ value: o, label: o }))}
            value={form.jobSeniority}
            onChange={(v) => set("jobSeniority", v)}
          />
        </Field>
        <Field label="Employment type">
          <Select
            options={JOB_TYPE_OPTIONS.map((o) => ({ value: o, label: JOB_TYPE_LABELS[o] }))}
            value={form.jobType}
            onChange={(v) => set("jobType", v)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location">
          <Select
            options={LOCATION_OPTIONS.map((o) => ({ value: o, label: o }))}
            value={form.jobLoc}
            onChange={(v) => set("jobLoc", v)}
          />
        </Field>
        <Field label="Timezone overlap">
          <Select
            options={TIMEZONE_OPTIONS.map((o) => ({ value: o, label: o }))}
            value={form.jobTz}
            onChange={(v) => set("jobTz", v)}
          />
        </Field>
      </div>

      <Field
        hint="What will this person do day-to-day? What does success look like in 6 months? Minimum 100 characters."
        label="Job description"
      >
        <Textarea
          placeholder={"What you'll do...\n\nWhat we're looking for..."}
          rows={8}
          value={form.jobDesc}
          onChange={(v) => set("jobDesc", v)}
        />
      </Field>

      <Field label="Required skills">
        <SkillTagEditor setSkills={(s) => set("jobSkills", s)} skills={form.jobSkills} />
      </Field>
      <Field label="Nice-to-have skills">
        <SkillTagEditor setSkills={(s) => set("jobNice", s)} skills={form.jobNice} />
      </Field>

      <div className="border-t border-neutral-100 pt-5">
        <h3 className="mb-4 text-[14px] font-semibold text-neutral-800">Compensation</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Min">
            <input
              className="w-full rounded-10 border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              min={0}
              type="number"
              value={form.salMin}
              onChange={(e) => set("salMin", Number(e.target.value))}
            />
          </Field>
          <Field label="Max">
            <input
              className="w-full rounded-10 border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              min={0}
              type="number"
              value={form.salMax}
              onChange={(e) => set("salMax", Number(e.target.value))}
            />
          </Field>
          <Field label="Currency">
            <Select
              options={CURRENCY_OPTIONS.map((o) => ({ value: o, label: o }))}
              value={form.salCur}
              onChange={(v) => set("salCur", v)}
            />
          </Field>
          <Field label="Period">
            <Select
              options={PERIOD_OPTIONS.map((o) => ({ value: o, label: o }))}
              value={form.salPer}
              onChange={(v) => set("salPer", v)}
            />
          </Field>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[13px] font-medium text-neutral-700">Benefits</p>
          <div className="flex flex-wrap gap-2">
            {BENEFIT_OPTIONS.map((b) => (
              <button
                className={cn(
                  "rounded-full border px-3 py-1 text-[12px] font-medium transition-all",
                  form.benefits.includes(b)
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300"
                )}
                key={b}
                type="button"
                onClick={() =>
                  set(
                    "benefits",
                    form.benefits.includes(b)
                      ? form.benefits.filter((x) => x !== b)
                      : [...form.benefits, b]
                  )
                }
              >
                {form.benefits.includes(b) && <Check className="mr-1 inline" size={10} />}
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
