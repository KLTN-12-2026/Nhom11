import type { ApplicationStatus } from "@/types/application";
import type { TalentProfile } from "@/types/talent";

export type AppStatusBucket = "applied" | "review" | "interview" | "offer" | "closed";

export const STATUS_TO_BUCKET: Record<ApplicationStatus, AppStatusBucket> = {
  PENDING: "applied",
  REVIEWING: "review",
  SHORTLISTED: "review",
  INTERVIEW: "interview",
  OFFERED: "offer",
  REJECTED: "closed",
  WITHDRAWN: "closed",
};

export const STAGE_LABEL: Record<ApplicationStatus, string> = {
  PENDING: "Sent",
  REVIEWING: "Under review",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interviewing",
  OFFERED: "Offer received",
  REJECTED: "Not selected",
  WITHDRAWN: "Withdrawn",
};

const trackedFields = (profile: TalentProfile): boolean[] => [
  !!profile.headline,
  !!profile.bio,
  !!profile.location,
  !!profile.timezone,
  profile.skills.length > 0,
  !!profile.resumeUrl,
  !!profile.desiredSalaryMin && !!profile.desiredSalaryMax,
  profile.yearsExperience !== null,
];

export const profileCompletion = (profile: TalentProfile | null | undefined): number => {
  if (!profile) return 0;
  const fields = trackedFields(profile);
  const done = fields.filter(Boolean).length;
  return Math.round((done / fields.length) * 100);
};

export const missingProfileFields = (profile: TalentProfile | null | undefined): string[] => {
  if (!profile) return ["headline", "bio", "skills"];
  const missing: string[] = [];
  if (!profile.headline) missing.push("a headline");
  if (!profile.bio) missing.push("a bio");
  if (profile.skills.length === 0) missing.push("skills");
  if (!profile.desiredSalaryMin) missing.push("your salary expectation");
  if (!profile.resumeUrl) missing.push("your CV");
  return missing;
};
