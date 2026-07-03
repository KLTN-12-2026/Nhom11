import { Link, useParams } from "react-router-dom";
import { Briefcase, Clock, Code2, FileText, Globe, MapPin, Settings, ShieldCheck, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { usePublicTalentProfile } from "@/features/talent/talent.queries";
import { useAuth } from "@/contexts/AuthContext";
import { LEVEL_TO_LABEL } from "@/features/talent/talent.schemas";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/constants/routes";

export function PublicTalentProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { data: profile, isLoading, isError } = usePublicTalentProfile(slug);
  useDocumentTitle(profile?.user?.name ? `${profile.user.name} — Talent Profile` : "Talent Profile");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <Skeleton className="h-48 w-full rounded-24" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Profile not found</h1>
        <p className="mt-2 text-sm text-neutral-500">This talent profile doesn&apos;t exist or was removed.</p>
        <Link className="mt-6" to={ROUTES.jobs}>
          <Button variant="primary">Browse jobs</Button>
        </Link>
      </div>
    );
  }

  const name = profile.user?.name ?? "RemoteSEA member";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const isOwnProfile = !!user && profile.userId === user.id;

  const links = [
    profile.githubUrl && { icon: Code2, label: profile.githubUrl, href: profile.githubUrl },
    profile.linkedinUrl && { icon: User, label: profile.linkedinUrl, href: profile.linkedinUrl },
    profile.portfolioUrl && { icon: Globe, label: profile.portfolioUrl, href: profile.portfolioUrl },
    profile.resumeUrl && { icon: FileText, label: "Resume / CV", href: profile.resumeUrl },
  ].filter((l): l is { icon: typeof Code2; label: string; href: string } => Boolean(l));

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        {/* Hero */}
        <div className="mb-6 grid gap-6 rounded-24 border border-neutral-100 bg-white p-8 lg:grid-cols-[auto_1fr_auto]">
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-[26px] font-bold text-white">
              {initials}
              {profile.isOpenToWork && (
                <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-500" />
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {profile.isOpenToWork && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-0.5 text-[11.5px] font-medium text-brand-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  Open to opportunities
                </span>
              )}
            </div>
            <h1 className="mb-1 text-[32px] font-semibold tracking-tight text-neutral-900">{name}</h1>
            {profile.headline && <p className="mb-3 text-[16px] text-neutral-500">{profile.headline}</p>}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {profile.location && (
                <span className="flex items-center gap-1.5 text-[13px] text-neutral-500">
                  <MapPin className="flex-shrink-0 text-neutral-400" size={12} />
                  {profile.location}
                </span>
              )}
              {profile.timezone && (
                <span className="flex items-center gap-1.5 text-[13px] text-neutral-500">
                  <Clock className="flex-shrink-0 text-neutral-400" size={12} />
                  {profile.timezone}
                </span>
              )}
              {profile.yearsExperience !== null && (
                <span className="flex items-center gap-1.5 text-[13px] text-neutral-500">
                  <Briefcase className="flex-shrink-0 text-neutral-400" size={12} />
                  {profile.yearsExperience}+ yrs experience
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[13px] text-neutral-500">
                <ShieldCheck className="flex-shrink-0 text-neutral-400" size={12} />
                {LEVEL_TO_LABEL[profile.level] ?? profile.level}
              </span>
            </div>
          </div>

          {profile.desiredSalaryMin && profile.desiredSalaryMax && (
            <div className="min-w-[200px] rounded-16 border border-neutral-100 bg-neutral-50 p-5">
              <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400">Expecting</p>
              <p className="text-[26px] font-semibold leading-tight tracking-tight text-neutral-900">
                ${(profile.desiredSalaryMin ?? 0).toLocaleString()}–${(profile.desiredSalaryMax ?? 0).toLocaleString()}
                <span className="ml-1 text-[14px] font-normal text-neutral-400"> / mo</span>
              </p>
              <p className="text-[12px] text-neutral-500">{profile.currency}</p>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-2">
            {profile.bio && (
              <section className="rounded-20 border border-neutral-100 bg-white p-7">
                <h2 className="mb-4 text-[17px] font-semibold text-neutral-900">About</h2>
                <p className="text-[14px] leading-relaxed text-neutral-600">{profile.bio}</p>
              </section>
            )}

            {profile.skills.length > 0 && (
              <section className="rounded-20 border border-neutral-100 bg-white p-7">
                <h2 className="mb-5 text-[17px] font-semibold text-neutral-900">Skills</h2>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map(({ skill, yearsExp }) => (
                    <span
                      className="rounded-8 border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[12.5px] text-neutral-700"
                      key={skill.id}
                    >
                      {skill.name}
                      {yearsExp ? ` · ${yearsExp}y` : ""}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {!profile.bio && profile.skills.length === 0 && (
              <section className="rounded-20 border border-neutral-100 bg-white p-7 text-center text-[13px] text-neutral-400">
                This member hasn&apos;t filled out their profile yet.
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <div className="space-y-4 lg:sticky lg:top-6">
              {links.length > 0 && (
                <div className="rounded-20 border border-neutral-100 bg-white p-5">
                  <h4 className="mb-3 text-[13px] font-semibold text-neutral-800">Links</h4>
                  <div className="space-y-1.5">
                    {links.map((l) => (
                      <a
                        className="flex items-center gap-2.5 rounded-10 px-2 py-1.5 text-[13px] text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                        href={l.href}
                        key={l.href}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <l.icon className="flex-shrink-0 text-neutral-400" size={14} />
                        <span className="flex-1 truncate">{l.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {isOwnProfile && (
                <Link
                  className="flex items-center justify-center gap-1.5 rounded-12 border border-neutral-200 bg-white py-2.5 text-[12.5px] font-medium text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-700"
                  to={ROUTES.profile}
                >
                  <Settings size={12} /> This is your profile · Edit
                </Link>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
