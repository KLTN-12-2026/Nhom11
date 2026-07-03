import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Asterisk,
  Briefcase,
  Code2,
  Globe,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/components/ui/toast";
import { SkillTagEditor } from "@/components/shared/SkillTagEditor";
import { useUpdateMyTalentProfile } from "@/features/talent/talent.queries";
import { useUpdateMyName } from "@/features/users/users.queries";
import { useSkills } from "@/features/taxonomy/taxonomy.queries";
import { ApiError } from "@/services/api-error";
import { applyServerErrors } from "@/utils/form-errors";
import {
  LABEL_TO_LEVEL,
  LEVEL_TO_LABEL,
  SENIORITY_OPTIONS,
  TIMEZONE_OPTIONS,
  YEARS_BUCKETS,
  bucketToYears,
  normalizeUrl,
  profileFormSchema,
  yearsToBucket,
  type ProfileFormValues,
} from "@/features/talent/talent.schemas";
import { ROUTES } from "@/constants/routes";
import type { TalentProfile } from "@/types/talent";

const PROF_SECTIONS = [
  { id: "basics", label: "Basics", icon: User },
  { id: "about", label: "About you", icon: Asterisk },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "skills", label: "Skills", icon: Code2 },
  { id: "prefs", label: "Preferences", icon: SlidersHorizontal },
  { id: "links", label: "Links & CV", icon: Share2 },
  { id: "visibility", label: "Visibility", icon: ShieldCheck },
];

// No work-history model exists in the backend yet (TalentProfile has no experience
// relation) — kept as illustrative static content, same as the source, until that
// feature exists server-side.
const SAMPLE_EXPERIENCE = [
  {
    initials: "FL",
    color: "#1F8A3A",
    company: "Finch Labs",
    flag: "🇸🇬",
    country: "Singapore",
    title: "Frontend Engineer",
    from: "May 2023",
    to: "Present",
    note: "Built the merchant onboarding flow for Finch's payment APIs. Owned the design system migration to Tailwind + Radix. React, TypeScript, Next.js.",
  },
  {
    initials: "CA",
    color: "#FF6D3B",
    company: "Carousell",
    flag: "🇸🇬",
    country: "Singapore",
    title: "Software Engineer",
    from: "Aug 2021",
    to: "Apr 2023",
    note: "Worked on the buyer-side checkout experience for the SG market. Shipped the offer-and-counteroffer feature used by 8M+ monthly users.",
  },
];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      aria-checked={on}
      className={cn(
        "relative h-6 w-11 flex-shrink-0 rounded-full border transition-colors",
        on ? "border-brand-600 bg-brand-600" : "border-neutral-300 bg-neutral-100"
      )}
      role="switch"
      type="button"
      onClick={() => onChange(!on)}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          on ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function SectionHead({
  eyebrow,
  title,
  help,
}: {
  eyebrow: string;
  title: React.ReactNode;
  help: string;
}) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_220px]">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          {eyebrow}
        </p>
        <h2 className="text-[22px] font-semibold text-neutral-900">{title}</h2>
      </div>
      <p className="text-[13px] leading-relaxed text-neutral-500">{help}</p>
    </div>
  );
}

const emphasis = { fontFamily: "var(--font-serif)" };

export function ProfileForm({ profile }: { profile: TalentProfile | null }) {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("basics");
  const [skills, setSkills] = useState<string[]>(profile?.skills.map((s) => s.skill.name) ?? []);
  const { data: allSkills } = useSkills();
  const updateProfile = useUpdateMyTalentProfile();
  const updateName = useUpdateMyName();

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

  const [salMin, salMax, isOpenToWork, resumeUrl] = watch([
    "desiredSalaryMin",
    "desiredSalaryMax",
    "isOpenToWork",
    "resumeUrl",
  ]);

  async function onSubmit(values: ProfileFormValues) {
    const skillIndex = Object.fromEntries(
      (allSkills ?? []).map((s) => [s.name.toLowerCase(), s.id])
    );
    const skillPayload = skills
      .map((s) => skillIndex[s.toLowerCase()])
      .filter((id): id is string => Boolean(id))
      .map((skillId) => ({ skillId }));

    try {
      if (values.name !== (profile?.user?.name ?? "")) {
        await updateName.mutateAsync(values.name);
      }
      await updateProfile.mutateAsync({
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
  }

  const saving = isSubmitting || updateProfile.isPending || updateName.isPending;

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
            <em className="font-serif italic text-brand-700" style={emphasis}>
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
            {/* BASICS */}
            <section
              className="rounded-20 scroll-mt-6 border border-neutral-100 bg-white p-7"
              id="basics"
            >
              <SectionHead
                eyebrow="01 · Identity"
                help="Your name, headline, location and timezone. This appears at the top of your profile."
                title={
                  <>
                    The{" "}
                    <em className="font-serif italic text-brand-700" style={emphasis}>
                      basics.
                    </em>
                  </>
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    className="block text-[12.5px] font-medium text-neutral-700"
                    htmlFor="p-name"
                  >
                    Full name
                  </label>
                  <input
                    className="rounded-10 focus:border-brand-500 w-full border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    id="p-name"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-[11.5px] text-red-600">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label
                    className="block text-[12.5px] font-medium text-neutral-700"
                    htmlFor="p-pronouns"
                  >
                    Pronouns <span className="font-normal text-neutral-400">(optional)</span>
                  </label>
                  <input
                    className="rounded-10 focus:border-brand-500 w-full border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    disabled
                    id="p-pronouns"
                    placeholder="Not tracked yet"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[12.5px] font-medium text-neutral-700">
                      Headline
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      {watch("headline")?.length ?? 0} / 80
                    </span>
                  </div>
                  <input
                    className="rounded-10 focus:border-brand-500 w-full border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    placeholder="Role · timezone · standout signal"
                    {...register("headline")}
                  />
                  {errors.headline && (
                    <p className="text-[11.5px] text-red-600">{errors.headline.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label
                    className="block text-[12.5px] font-medium text-neutral-700"
                    htmlFor="p-loc"
                  >
                    Where are you based?
                  </label>
                  <input
                    className="rounded-10 focus:border-brand-500 w-full border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    id="p-loc"
                    {...register("location")}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    className="block text-[12.5px] font-medium text-neutral-700"
                    htmlFor="p-tz"
                  >
                    Working timezone
                  </label>
                  <select
                    className="rounded-10 focus:border-brand-500 w-full border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    id="p-tz"
                    {...register("timezone")}
                  >
                    {TIMEZONE_OPTIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* ABOUT */}
            <section
              className="rounded-20 scroll-mt-6 border border-neutral-100 bg-white p-7"
              id="about"
            >
              <SectionHead
                eyebrow="02 · Story"
                help="A short, plain-English summary. No buzzwords — write like you'd describe yourself in an email."
                title={
                  <>
                    About{" "}
                    <em className="font-serif italic text-brand-700" style={emphasis}>
                      you.
                    </em>
                  </>
                }
              />
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12.5px] font-medium text-neutral-700">
                      Bio <span className="font-normal text-neutral-400">2–4 sentences</span>
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      {watch("bio")?.length ?? 0} / 320
                    </span>
                  </div>
                  <textarea
                    className="rounded-10 focus:border-brand-500 w-full resize-none border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    rows={4}
                    {...register("bio")}
                  />
                  {errors.bio && <p className="text-[11.5px] text-red-600">{errors.bio.message}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-[12.5px] font-medium text-neutral-700">
                      Seniority
                    </label>
                    <select
                      className="rounded-10 focus:border-brand-500 w-full border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      {...register("seniority")}
                    >
                      {SENIORITY_OPTIONS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[12.5px] font-medium text-neutral-700">
                      Years of experience
                    </label>
                    <select
                      className="rounded-10 focus:border-brand-500 w-full border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      {...register("yearsBucket")}
                    >
                      {YEARS_BUCKETS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* EXPERIENCE (illustrative — no backend model yet) */}
            <section
              className="rounded-20 scroll-mt-6 border border-neutral-100 bg-white p-7"
              id="experience"
            >
              <SectionHead
                eyebrow="03 · Track record"
                help="Work history isn't backed by an API yet — shown here as a preview of the layout."
                title={
                  <em className="font-serif italic text-brand-700" style={emphasis}>
                    Experience.
                  </em>
                }
              />
              <div className="divide-y divide-neutral-50">
                {SAMPLE_EXPERIENCE.map((exp) => (
                  <div className="flex gap-4 py-4 first:pt-0" key={exp.company}>
                    <div
                      className="rounded-10 flex h-10 w-10 flex-shrink-0 items-center justify-center text-[13px] font-bold text-white"
                      style={{ background: exp.color }}
                    >
                      {exp.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-neutral-900">
                        {exp.title}{" "}
                        <span className="font-normal text-neutral-500">at {exp.company}</span>
                      </p>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[12px] text-neutral-400">
                        <span>
                          {exp.flag} {exp.country}
                        </span>
                        <span className="h-0.5 w-0.5 rounded-full bg-neutral-300" />
                        <span className="font-mono">
                          {exp.from} → {exp.to}
                        </span>
                      </p>
                      <p className="text-[12.5px] leading-relaxed text-neutral-600">{exp.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SKILLS */}
            <section
              className="rounded-20 scroll-mt-6 border border-neutral-100 bg-white p-7"
              id="skills"
            >
              <SectionHead
                eyebrow="04 · What you use"
                help="5–12 specific skills. Tools and stacks, not soft skills. We match jobs based on this."
                title={
                  <em className="font-serif italic text-brand-700" style={emphasis}>
                    Skills.
                  </em>
                }
              />
              <SkillTagEditor setSkills={setSkills} skills={skills} />
            </section>

            {/* PREFERENCES */}
            <section
              className="rounded-20 scroll-mt-6 border border-neutral-100 bg-white p-7"
              id="prefs"
            >
              <SectionHead
                eyebrow="05 · What you want"
                help="Your salary expectation. Only shown to employers if you're open to work."
                title={
                  <>
                    Job{" "}
                    <em className="font-serif italic text-brand-700" style={emphasis}>
                      preferences.
                    </em>
                  </>
                }
              />
              <div className="rounded-16 border border-neutral-100 bg-neutral-50 p-5">
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-[13px] font-medium text-neutral-700">
                    Salary expectation
                  </label>
                  <span className="text-[11.5px] text-neutral-400">
                    Visible only if open to work
                  </span>
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
                      max={10000}
                      min={1000}
                      step={100}
                      type="range"
                      value={salMin}
                      onChange={(e) =>
                        setValue("desiredSalaryMin", Math.min(Number(e.target.value), salMax - 200))
                      }
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] text-neutral-400">Maximum</p>
                    <input
                      className="w-full accent-brand-600"
                      max={10000}
                      min={1000}
                      step={100}
                      type="range"
                      value={salMax}
                      onChange={(e) =>
                        setValue("desiredSalaryMax", Math.max(Number(e.target.value), salMin + 200))
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* LINKS */}
            <section
              className="rounded-20 scroll-mt-6 border border-neutral-100 bg-white p-7"
              id="links"
            >
              <SectionHead
                eyebrow="06 · Where to look"
                help="Attach your CV and a couple of links. Hiring managers want to read your writing or code."
                title={
                  <>
                    Links &amp;{" "}
                    <em className="font-serif italic text-brand-700" style={emphasis}>
                      CV.
                    </em>
                  </>
                }
              />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-10 flex h-9 w-9 flex-shrink-0 items-center justify-center bg-neutral-100 text-neutral-500">
                    <Briefcase size={15} />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <label className="block text-[12px] font-medium text-neutral-700">
                      CV / Resume (PDF)
                    </label>
                    <FileUpload
                      accept="application/pdf"
                      label="Upload CV"
                      type="resume"
                      value={resumeUrl}
                      onUploaded={(url) => setValue("resumeUrl", url)}
                    />
                  </div>
                </div>

                {[
                  {
                    icon: Code2,
                    label: "GitHub",
                    field: "githubUrl" as const,
                    placeholder: "github.com/you",
                  },
                  {
                    icon: User,
                    label: "LinkedIn",
                    field: "linkedinUrl" as const,
                    placeholder: "linkedin.com/in/you",
                  },
                  {
                    icon: Globe,
                    label: "Portfolio / personal site",
                    field: "portfolioUrl" as const,
                    placeholder: "https://",
                  },
                ].map(({ icon: Icon, label, field, placeholder }) => (
                  <div className="flex items-center gap-3" key={field}>
                    <span className="rounded-10 flex h-9 w-9 flex-shrink-0 items-center justify-center bg-neutral-100 text-neutral-500">
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <label className="block text-[12px] font-medium text-neutral-700">
                        {label}
                      </label>
                      <input
                        className="rounded-10 focus:border-brand-500 w-full border border-neutral-200 bg-white px-3 py-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                        placeholder={placeholder}
                        {...register(field)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* VISIBILITY */}
            <section
              className="rounded-20 scroll-mt-6 border border-neutral-100 bg-white p-7"
              id="visibility"
            >
              <SectionHead
                eyebrow="07 · Who sees you"
                help="Employers can only find and contact you while you're open to work."
                title={
                  <em className="font-serif italic text-brand-700" style={emphasis}>
                    Visibility.
                  </em>
                }
              />
              <div className="flex items-center justify-between rounded-16 border border-neutral-200 bg-white px-4 py-4">
                <div>
                  <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-neutral-900">
                    <ShieldCheck
                      className={isOpenToWork ? "text-brand-600" : "text-neutral-400"}
                      size={14}
                    />
                    Open to work
                  </p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">
                    {isOpenToWork
                      ? "Your profile and salary expectation are visible to employers."
                      : "Your profile is hidden and your salary expectation is not shown."}
                  </p>
                </div>
                <Toggle on={isOpenToWork} onChange={(v) => setValue("isOpenToWork", v)} />
              </div>
            </section>

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
}
