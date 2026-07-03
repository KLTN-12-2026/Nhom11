import { z } from "zod";

export const JOB_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE"] as const;
export const LEVELS = ["ENTRY", "MID", "SENIOR", "LEAD", "EXECUTIVE"] as const;
export const FREQUENCIES = ["IMMEDIATE", "DAILY", "WEEKLY"] as const;

export const createAlertFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  keywords: z.string().max(200).optional(),
  jobType: z.enum(JOB_TYPES).optional().or(z.literal("")),
  level: z.enum(LEVELS).optional().or(z.literal("")),
  salaryMin: z.string().optional(),
  frequency: z.enum(FREQUENCIES),
  categoryIds: z.array(z.string()),
});
export type CreateAlertFormValues = z.infer<typeof createAlertFormSchema>;
