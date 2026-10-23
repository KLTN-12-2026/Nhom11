import type { ExperienceLevel, Skill } from "@/types/job";

export type TalentSkill = { talentId: string; skillId: string; yearsExp: number | null; skill: Skill };

export type TalentProfile = {
  id: string;
  userId: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  timezone: string | null;
  yearsExperience: number | null;
  level: ExperienceLevel;
  resumeUrl: string | null;
  portfolioUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  isOpenToWork: boolean;
  // Omitted entirely (not null) by GET /talent/:slug when isOpenToWork is false.
  desiredSalaryMin?: number | null;
  desiredSalaryMax?: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  skills: TalentSkill[];
  user?: { name: string | null; image?: string | null };
};

export type UpdateTalentProfilePayload = Partial<{
  headline: string;
  bio: string;
  location: string;
  country: string;
  timezone: string;
  yearsExperience: number;
  level: ExperienceLevel;
  resumeUrl: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  isOpenToWork: boolean;
  desiredSalaryMin: number;
  desiredSalaryMax: number;
  skills: { skillId: string; yearsExp?: number }[];
}>;
