import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { useToast } from "@/components/ui/toast";
import { SkillTagEditor } from "@/components/shared/SkillTagEditor";
import { useUpdateMyTalentProfile } from "@/features/talent/talent.queries";
import { useUpdateMyName } from "@/features/users/users.queries";
import { useSkills } from "@/features/taxonomy/taxonomy.queries";
import { ApiError } from "@/services/api-error";
import { applyServerErrors } from "@/utils/form-errors";
import { PROF_SECTIONS } from "@/features/talent/components/profile-form/profile-form.constants";
import { SectionHead, EMPHASIS_STYLE } from "@/features/talent/components/profile-form/SectionHead";
import { BasicsSection } from "@/features/talent/components/profile-form/BasicsSection";
import { AboutSection } from "@/features/talent/components/profile-form/AboutSection";
import { ExperienceSection } from "@/features/talent/components/profile-form/ExperienceSection";
import { PreferencesSection } from "@/features/talent/components/profile-form/PreferencesSection";
import { LinksSection } from "@/features/talent/components/profile-form/LinksSection";
import { VisibilitySection } from "@/features/talent/components/profile-form/VisibilitySection";
import {
  LABEL_TO_LEVEL,
  LEVEL_TO_LABEL,
  TIMEZONE_OPTIONS,
  bucketToYears,
  normalizeUrl,
  yearsToBucket,
} from "@/features/talent/talent.constants";
import { profileFormSchema, type ProfileFormValues } from "@/features/talent/talent.schemas";
import { ROUTES } from "@/constants/routes";
import type { TalentProfile } from "@/types/talent";

interface ProfileFormProps {
  profile: TalentProfile | null;
}

export const ProfileForm = ({ profile }: ProfileFormProps) => {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("basics");
  const [skills, setSkills] = useState<string[]>(profile?.skills.map((s) => s.skill.name) ?? []);
  const { data: allSkills } = useSkills();
  const updateProfileMutation = useUpdateMyTalentProfile();
  const updateNameMutation = useUpdateMyName();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.user?.name ?? "",
      headline: profile?.headline ?? "",
      location: profile?.location ?? "",
      timezone: profile?.timezone ?? TIMEZONE_OPTIONS[0],
      bio: profile?.bio ?? "",
      seniority: LEVEL_TO_LABEL[profile?.level ?? "MID"],
      yearsBucket: yearsToBucket(profile?.yearsExperience ?? null),
      desiredSalaryMin: profile?.desiredSalaryMin ?? 1000,
      desiredSalaryMax: profile?.desiredSalaryMax ?? 3000,
      isOpenToWork: profile?.isOpenToWork ?? true,
      resumeUrl: profile?.resumeUrl ?? "",
      githubUrl: profile?.githubUrl ?? "",
      linkedinUrl: profile?.linkedinUrl ?? "",
      portfolioUrl: profile?.portfolioUrl ?? "",
    },
  });

  useEffect(() => {
    if (!profile) return;
    reset({
      name: profile.user?.name ?? "",
      headline: profile.headline ?? "",
      location: profile.location ?? "",
      timezone: profile.timezone ?? TIMEZONE_OPTIONS[0],
      bio: profile.bio ?? "",
      seniority: LEVEL_TO_LABEL[profile.level] ?? "Mid",
      yearsBucket: yearsToBucket(profile.yearsExperience),
      desiredSalaryMin: profile.desiredSalaryMin ?? 1000,
      desiredSalaryMax: profile.desiredSalaryMax ?? 3000,
      isOpenToWork: profile.isOpenToWork,
      resumeUrl: profile.resumeUrl ?? "",
      githubUrl: profile.githubUrl ?? "",
      linkedinUrl: profile.linkedinUrl ?? "",
      portfolioUrl: profile.portfolioUrl ?? "",
    });
    setSkills(profile.skills.map((s) => s.skill.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => {
    const ids = PROF_SECTIONS.map((s) => s.id);
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActiveSection(hit.target.id);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const [headline, bio, salMin, salMax, isOpenToWork, resumeUrl] = watch([
    "headline",
    "bio",
    "desiredSalaryMin",
    "desiredSalaryMax",
    "isOpenToWork",
    "resumeUrl",
  ]);

  const onSubmit = async (values: ProfileFormValues) => {
    const skillIndex = Object.fromEntries(
      (allSkills ?? []).map((s) => [s.name.toLowerCase(), s.id])
    );
    const skillPayload = skills
      .map((s) => skillIndex[s.toLowerCase()])
      .filter((id): id is string => Boolean(id))
      .map((skillId) => ({ skillId }));

    try {
      if (values.name !== (profile?.user?.name ?? "")) {
        await updateNameMutation.mutateAsync(values.name);
      }
      await updateProfileMutation.mutateAsync({
        headline: values.headline || undefined,
        bio: values.bio || undefined,
        location: values.location || undefined,
        timezone: values.timezone || undefined,
        level: LABEL_TO_LEVEL[values.seniority],
        yearsExperience: bucketToYears(values.yearsBucket),
        desiredSalaryMin: values.desiredSalaryMin,
        desiredSalaryMax: values.desiredSalaryMax,
        isOpenToWork: values.isOpenToWork,
        resumeUrl: normalizeUrl(values.resumeUrl ?? ""),
        githubUrl: normalizeUrl(values.githubUrl ?? ""),
        linkedinUrl: normalizeUrl(values.linkedinUrl ?? ""),
        portfolioUrl: normalizeUrl(values.portfolioUrl ?? ""),
        skills: skillPayload,
      });
      toast({ variant: "success", title: "Profile saved" });
    } catch (err) {
      if (err instanceof ApiError) applyServerErrors(err, setError);
      toast({ variant: "error", title: "Couldn't save profile", description: "Please try again." });
    }
  };

  const saving = isSubmitting || updateProfileMutation.isPending || updateNameMutation.isPending;

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-1.5 text-[12px] text-neutral-500">
            <Link className="hover:text-neutral-700" to={ROUTES.talent}>
              ← Dashboard
            </Link>
            <span>·</span>
            <span>Profile setup</span>
          </div>
          <h1 className="mb-1 text-[32px] font-semibold tracking-tight text-neutral-900">
            Make sure recruiters{" "}
            <em className="font-serif italic text-brand-700" style={EMPHASIS_STYLE}>
              see what matters.
            </em>
          </h1>
          <p className="text-[15px] text-neutral-500">
            Your profile is what gets surfaced to founders and hiring managers. Keep it honest, keep
            it short — they read dozens a day.
          </p>
        </div>

        <form className="grid gap-8 lg:grid-cols-[180px_1fr]" onSubmit={handleSubmit(onSubmit)}>
          {/* Sticky nav */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-0.5">
              {PROF_SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    className={cn(
                      "rounded-10 flex w-full items-center justify-between px-3 py-2 text-[13px] transition-all",
                      activeSection === s.id
                        ? "bg-white font-medium text-neutral-900 shadow-sm"
                        : "text-neutral-500 hover:bg-white/60 hover:text-neutral-700"
                    )}
                    key={s.id}
                    type="button"
                    onClick={() => scrollTo(s.id)}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={13} />
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Sections */}
          <div className="space-y-2">
            <BasicsSection
              headlineError={errors.headline?.message}
              headlineLength={headline?.length ?? 0}
              nameError={errors.name?.message}
              register={register}
            />

            <AboutSection bioError={errors.bio?.message} bioLength={bio?.length ?? 0} register={register} />

            <ExperienceSection />

            <section className="rounded-20 scroll-mt-6 border border-neutral-100 bg-white p-7" id="skills">
              <SectionHead
                eyebrow="04 · What you use"
                help="5–12 specific skills. Tools and stacks, not soft skills. We match jobs based on this."
                title={
                  <em className="font-serif italic text-brand-700" style={EMPHASIS_STYLE}>
                    Skills.
                  </em>
                }
              />
              <SkillTagEditor setSkills={setSkills} skills={skills} />
            </section>

            <PreferencesSection
              onMaxChange={(v) => setValue("desiredSalaryMax", v)}
              onMinChange={(v) => setValue("desiredSalaryMin", v)}
              salMax={salMax}
              salMin={salMin}
            />

            <LinksSection
              onResumeUploaded={(url) => setValue("resumeUrl", url)}
              register={register}
              resumeUrl={resumeUrl ?? ""}
            />

            <VisibilitySection isOpenToWork={isOpenToWork} onToggle={(v) => setValue("isOpenToWork", v)} />

            {/* Save bar */}
            <div className="rounded-20 sticky bottom-0 flex items-center justify-between border border-neutral-200 bg-white/90 px-5 py-3 shadow-card backdrop-blur-sm">
              <span className="flex items-center gap-2 text-[12.5px] text-neutral-500">
                <span className="bg-brand-500 h-2 w-2 rounded-full" />
                {saving ? "Saving…" : "Save your changes"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-10 border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-300 disabled:opacity-60"
                  disabled={saving}
                  type="submit"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <Link
                  className="rounded-10 inline-flex items-center gap-1.5 bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700"
                  to={ROUTES.talent}
                >
                  Done <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
