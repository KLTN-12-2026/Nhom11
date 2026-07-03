import { ArrowRight, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import type { PostJobFormState } from "@/features/post-job/post-job.schemas";
import { TIERS } from "@/features/post-job/post-job.schemas";

// Shown when Stripe isn't configured on the backend and checkout couldn't be started —
// the job was still created (as an unpaid DRAFT), so this confirms that honestly
// instead of implying a payment succeeded.
export function PostJobDraftSaved({ form, jobId }: { form: PostJobFormState; jobId: string }) {
  const tier = TIERS.find((t) => t.id === form.tier) ?? TIERS[0];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F7F4] px-6 py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-100">
        <BadgeCheck className="text-brand-600" size={40} />
      </div>
      <h1 className="mb-2 text-[32px] font-semibold tracking-tight text-neutral-900">
        Your job has been saved
      </h1>
      <p className="mb-6 max-w-md text-[15px] text-neutral-500">
        <strong className="text-neutral-800">{form.jobTitle || "Your job"}</strong> at{" "}
        <strong className="text-neutral-800">{form.coName || "your company"}</strong> was created as a
        draft. Checkout couldn&apos;t be started, so it hasn&apos;t been paid or submitted for review
        yet.
      </p>

      <div className="mb-8 w-full max-w-md rounded-20 border border-neutral-200 bg-white p-6 text-left shadow-card">
        <p className="mb-4 text-[12px] font-semibold uppercase tracking-widest text-neutral-400">
          Job details
        </p>
        {[
          { k: "Plan selected", v: `${tier.name} ($${tier.price})` },
          { k: "Company", v: form.coName || "—" },
          { k: "Role", v: form.jobTitle || "—" },
          { k: "Reference", v: jobId },
        ].map(({ k, v }) => (
          <div className="flex items-center justify-between border-b border-neutral-50 py-2.5 last:border-none" key={k}>
            <span className="text-[12.5px] text-neutral-500">{k}</span>
            <span className="text-[13px] text-neutral-900">{v}</span>
          </div>
        ))}
      </div>

      <Link
        className="inline-flex h-11 items-center gap-2 rounded-12 bg-brand-600 px-5 text-sm font-medium text-white hover:bg-brand-700"
        to={ROUTES.employerDashboard}
      >
        Go to dashboard <ArrowRight size={14} />
      </Link>
    </div>
  );
}
