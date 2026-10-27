import { z } from "zod";
import { SENIORITY_OPTIONS, YEARS_BUCKETS } from "@/features/talent/talent.constants";

export const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  headline: z.string().max(80, "Keep it under 80 characters").optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  bio: z.string().max(320, "Keep it under 320 characters").optional(),
  seniority: z.enum(SENIORITY_OPTIONS),
  yearsBucket: z.enum(YEARS_BUCKETS),
  desiredSalaryMin: z.number().int().min(0),
  desiredSalaryMax: z.number().int().min(0),
  isOpenToWork: z.boolean(),
  resumeUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
});
export type ProfileFormValues = z.infer<typeof profileFormSchema>;
