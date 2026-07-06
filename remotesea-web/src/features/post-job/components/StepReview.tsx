import { Shield } from "lucide-react";
import { TIERS, type PostJobFormState } from "@/features/post-job/post-job.schemas";

interface StepReviewProps {
  form: PostJobFormState;
}

// Actual payment happens on Stripe's hosted Checkout page after "Pay & publish" —
// there's no real card-collection endpoint on the backend, so this step is a plain
// review + redirect rather than a (non-functional) credit card form.
export const StepReview = ({ form }: StepReviewProps) => {
  const tier = TIERS.find((t) => t.id === form.tier) ?? TIERS[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[22px] font-semibold text-neutral-900">Review &amp; pay</h2>
        <p className="mt-1 text-sm text-neutral-500">
          You&apos;ll complete payment securely on Stripe&apos;s checkout page.
        </p>
      </div>

      <div className="rounded-16 border border-neutral-100 bg-neutral-50 p-5">
        <div className="space-y-2 text-[13.5px]">
          <div className="flex justify-between text-neutral-600">
            <span>{form.jobTitle || "Untitled role"}</span>
            <span>{form.coName || "Your company"}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 font-semibold text-neutral-900">
            <span>{tier.name} listing</span>
            <span>${tier.price}</span>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-neutral-400">
          <Shield className="text-brand-500" size={11} />
          Secured by Stripe · SSL encrypted · No recurring billing
        </p>
      </div>
    </div>
  );
};
