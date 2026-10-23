import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Check, Shield, Tag, Zap } from "lucide-react";
import { cn } from "@/utils/cn";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/services/api-error";
import { useCategories, useSkills } from "@/features/taxonomy/taxonomy.queries";
import { useCreateEmployerProfile } from "@/features/employer/employer.queries";
import { useCreateJob } from "@/features/jobs/jobs.queries";
import { useCreateCheckoutSession } from "@/features/billing/billing.queries";
import { StepCompany } from "@/features/post-job/components/StepCompany";
import { StepRole } from "@/features/post-job/components/StepRole";
import { StepPlan } from "@/features/post-job/components/StepPlan";
import { StepReview } from "@/features/post-job/components/StepReview";
import { PreviewCard } from "@/features/post-job/components/PreviewCard";
import { PostJobDraftSaved } from "@/features/post-job/components/PostJobDraftSaved";
import {
  hqToCountry,
  INITIAL_FORM_STATE,
  JOB_TYPE_TO_ENUM,
  SENIORITY_TO_LEVEL,
  TIERS,
  type PostJobFormState,
} from "@/features/post-job/post-job.schemas";
import { ROUTES } from "@/constants/routes";

const STEPS = [
  { id: 1, label: "Company" },
  { id: 2, label: "Role" },
  { id: 3, label: "Plan" },
  { id: 4, label: "Review & pay" },
];

const MIN_JOB_DESCRIPTION_LENGTH = 100;
const MAX_SKILL_IDS = 15;
const MAX_BENEFITS = 10;
const PROFILE_ALREADY_EXISTS_STATUS = 409;

export const PostJobWizard = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<PostJobFormState>(INITIAL_FORM_STATE);
  const [publishedJobId, setPublishedJobId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: categories } = useCategories();
  const { data: allSkills } = useSkills();
  const createProfileMutation = useCreateEmployerProfile();
  const createJobMutation = useCreateJob();
  const createCheckoutMutation = useCreateCheckoutSession();

  // Default the category once real categories load — adjusted during render (not in
  // an effect) so it's applied in the same pass, guarded to run only once.
  const [categoryDefaulted, setCategoryDefaulted] = useState(false);
  if (!categoryDefaulted && categories && categories.length > 0) {
    setCategoryDefaulted(true);
    if (!form.jobCategoryId) {
      setForm((prev) => ({ ...prev, jobCategoryId: categories[0].id }));
    }
  }

  const set = (k: keyof PostJobFormState, v: unknown) => setForm((prev) => ({ ...prev, [k]: v }));

  const fail = (msg: string) => {
    setError(msg);
    setPublishing(false);
    toast({ variant: "error", title: "Couldn't publish job", description: msg });
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);

    if (form.jobDesc.trim().length < MIN_JOB_DESCRIPTION_LENGTH) {
      fail(`Job description must be at least ${MIN_JOB_DESCRIPTION_LENGTH} characters.`);
      return;
    }
    if (!form.jobCategoryId) {
      fail("Could not load job categories. Please try again.");
      return;
    }

    try {
      await createProfileMutation.mutateAsync({
        companyName: form.coName,
        websiteUrl: form.coWeb || undefined,
        description: form.coAbout || undefined,
        size: form.coSize || undefined,
        hqCountry: hqToCountry(form.coHq),
      });
    } catch (err) {
      // A 409 just means this employer already has a profile — fine, continue.
      if (!(err instanceof ApiError && err.status === PROFILE_ALREADY_EXISTS_STATUS)) {
        fail("Could not save your company profile. Please try again.");
        return;
      }
    }

    const skillIndex = Object.fromEntries((allSkills ?? []).map((s) => [s.name.toLowerCase(), s.id]));
    const skillIds = form.jobSkills
      .map((s) => skillIndex[s.toLowerCase()])
      .filter((id): id is string => Boolean(id))
      .slice(0, MAX_SKILL_IDS);

    let jobId: string;
    try {
      const job = await createJobMutation.mutateAsync({
        title: form.jobTitle,
        description: form.jobDesc,
        jobType: JOB_TYPE_TO_ENUM[form.jobType],
        level: SENIORITY_TO_LEVEL[form.jobSeniority],
        salaryMin: form.salMin,
        salaryMax: form.salMax,
        timezone: form.jobTz || undefined,
        country: hqToCountry(form.coHq),
        benefits: form.benefits.slice(0, MAX_BENEFITS),
        planType: TIERS.find((t) => t.id === form.tier)?.planType ?? "STANDARD",
        categoryIds: [form.jobCategoryId],
        skillIds,
      });
      jobId = job.id;
    } catch {
      fail("Could not create the job. Check the required fields and try again.");
      return;
    }

    try {
      const { url } = await createCheckoutMutation.mutateAsync(jobId);
      if (url) {
        window.location.href = url;
        return;
      }
    } catch {
      // Stripe not configured — job saved as DRAFT; show the honest fallback below.
    }

    setPublishing(false);
    setPublishedJobId(jobId);
  };

  if (publishedJobId) return <PostJobDraftSaved form={form} jobId={publishedJobId} />;

  const selectedTier = TIERS.find((t) => t.id === form.tier) ?? TIERS[0];

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Top bar */}
      <div className="border-b border-neutral-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <Link className="text-[15px] font-semibold text-neutral-900" to={ROUTES.home}>
            RemoteSEA
          </Link>
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div className="flex items-center gap-1" key={s.id}>
                <button
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-[11.5px] font-medium transition-all",
                    step === s.id
                      ? "bg-brand-600 text-white"
                      : step > s.id
                        ? "bg-brand-100 text-brand-700"
                        : "bg-neutral-100 text-neutral-400"
                  )}
                  type="button"
                  onClick={() => {
                    if (s.id < step) setStep(s.id);
                  }}
                >
                  {step > s.id ? <Check size={11} /> : s.id}
                </button>
                <span
                  className={cn(
                    "hidden text-[12px] font-medium sm:inline",
                    step === s.id ? "text-neutral-900" : "text-neutral-400"
                  )}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && <ChevronRight className="text-neutral-300" size={14} />}
              </div>
            ))}
          </div>
          <div className="text-[12px] text-neutral-400">
            Step {step} / {STEPS.length}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-[1200px] gap-8 px-6 py-10 lg:grid lg:grid-cols-[1fr_320px]">
        <div className="rounded-20 border border-neutral-200 bg-white p-8">
          {step === 1 && <StepCompany form={form} set={set} />}
          {step === 2 && <StepRole form={form} set={set} />}
          {step === 3 && <StepPlan form={form} set={set} />}
          {step === 4 && <StepReview form={form} />}

          {error && (
            <p className="mt-4 rounded-10 bg-red-50 px-3 py-2 text-[13px] text-red-600">{error}</p>
          )}

          <div className="mt-8 flex justify-between border-t border-neutral-100 pt-6">
            {step > 1 ? (
              <button
                className="rounded-12 border border-neutral-200 px-5 py-2.5 text-[13.5px] font-medium text-neutral-600 hover:border-neutral-300"
                type="button"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </button>
            ) : (
              <div />
            )}
            {step < 4 ? (
              <button
                className="inline-flex items-center gap-2 rounded-12 bg-brand-600 px-6 py-2.5 text-[13.5px] font-medium text-white hover:bg-brand-700"
                type="button"
                onClick={() => setStep((s) => s + 1)}
              >
                Continue <ChevronRight size={14} />
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-2 rounded-12 bg-brand-600 px-6 py-2.5 text-[13.5px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                disabled={publishing}
                type="button"
                onClick={handlePublish}
              >
                <Zap size={14} /> {publishing ? "Processing…" : "Pay & publish"}
              </button>
            )}
          </div>
        </div>

        {/* Sticky aside */}
        <div className="hidden lg:block">
          <div className="sticky top-6 space-y-4">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                <Tag className="mr-1 inline" size={10} />
                Live preview
              </p>
              <PreviewCard form={form} />
            </div>

            <div className="rounded-16 border border-neutral-100 bg-white p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Order summary
              </p>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between text-neutral-600">
                  <span>{selectedTier.name}</span>
                  <span>${selectedTier.price}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-100 pt-2 font-semibold text-neutral-900">
                  <span>Total</span>
                  <span>${selectedTier.price}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-12 border border-neutral-100 bg-white p-3 text-[12px] text-neutral-400">
              <Shield className="flex-shrink-0 text-brand-500" size={13} />
              Secured by Stripe · SSL encrypted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
