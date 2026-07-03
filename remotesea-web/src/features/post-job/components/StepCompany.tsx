import { Field, Input, Select, Textarea } from "@/features/post-job/components/form-primitives";
import { COMPANY_SIZE_OPTIONS, HQ_OPTIONS, type PostJobFormState } from "@/features/post-job/post-job.schemas";

export function StepCompany({
  form,
  set,
}: {
  form: PostJobFormState;
  set: (k: keyof PostJobFormState, v: unknown) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[22px] font-semibold text-neutral-900">About your company</h2>
        <p className="mt-1 text-sm text-neutral-500">
          This builds the employer card candidates see on your listing.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name">
          <Input placeholder="Acme Corp" value={form.coName} onChange={(v) => set("coName", v)} />
        </Field>
        <Field label="Website">
          <Input placeholder="https://acme.com" value={form.coWeb} onChange={(v) => set("coWeb", v)} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company size">
          <Select
            options={COMPANY_SIZE_OPTIONS.map((o) => ({ value: o, label: o }))}
            value={form.coSize}
            onChange={(v) => set("coSize", v)}
          />
        </Field>
        <Field label="Headquarters">
          <Select
            options={HQ_OPTIONS.map((o) => ({ value: o, label: o }))}
            value={form.coHq}
            onChange={(v) => set("coHq", v)}
          />
        </Field>
      </div>
      <Field hint="Max 80 chars, shown under company name" label="One-line tagline">
        <Input
          placeholder="We build tools that help developers ship faster."
          value={form.coTag}
          onChange={(v) => set("coTag", v)}
        />
      </Field>
      <Field hint="Aim for 80–150 words." label="Company overview">
        <Textarea
          placeholder="Tell candidates what you do, who you serve, and why it matters…"
          rows={4}
          value={form.coAbout}
          onChange={(v) => set("coAbout", v)}
        />
      </Field>

      <div className="border-t border-neutral-100 pt-5">
        <h3 className="mb-4 text-[14px] font-semibold text-neutral-800">Recruiter / hiring manager</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Full name">
            <Input placeholder="Alex Chen" value={form.recName} onChange={(v) => set("recName", v)} />
          </Field>
          <Field label="Role">
            <Input
              placeholder="Engineering Manager"
              value={form.recRole}
              onChange={(v) => set("recRole", v)}
            />
          </Field>
          <Field label="Work email">
            <Input
              placeholder="alex@acme.com"
              type="email"
              value={form.recEmail}
              onChange={(v) => set("recEmail", v)}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
