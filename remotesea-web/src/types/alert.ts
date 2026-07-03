import type { ExperienceLevel, JobType } from "@/types/job";

export type AlertFrequency = "IMMEDIATE" | "DAILY" | "WEEKLY";

export type JobAlert = {
  id: string;
  userId: string;
  name: string;
  keywords: string | null;
  jobType: JobType | null;
  level: ExperienceLevel | null;
  salaryMin: number | null;
  country: string | null;
  timezone: string | null;
  frequency: AlertFrequency;
  isActive: boolean;
  lastSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  categories: { category: { id: string; name: string } }[];
};

export type CreateAlertPayload = {
  name: string;
  keywords?: string;
  jobType?: JobType;
  level?: ExperienceLevel;
  salaryMin?: number;
  country?: string;
  timezone?: string;
  frequency?: AlertFrequency;
  categoryIds?: string[];
};
