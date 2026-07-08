import type { ExperienceLevel } from "@/types/job";

export const YEARS_BUCKETS = ["0–2", "2–5", "5–10", "10+"] as const;
export type YearsBucket = (typeof YEARS_BUCKETS)[number];

const BUCKET_TO_YEARS: Record<YearsBucket, number> = {
  "0–2": 1,
  "2–5": 3,
  "5–10": 7,
  "10+": 12,
};

export const bucketToYears = (bucket: YearsBucket): number => BUCKET_TO_YEARS[bucket];

export const yearsToBucket = (years: number | null): YearsBucket => {
  if (years === null) return "0–2";
  if (years <= 2) return "0–2";
  if (years <= 5) return "2–5";
  if (years <= 10) return "5–10";
  return "10+";
};

export const SENIORITY_OPTIONS = ["Junior", "Mid", "Senior", "Staff", "Principal / Lead"] as const;

export const LABEL_TO_LEVEL: Record<(typeof SENIORITY_OPTIONS)[number], ExperienceLevel> = {
  Junior: "ENTRY",
  Mid: "MID",
  Senior: "SENIOR",
  Staff: "LEAD",
  "Principal / Lead": "EXECUTIVE",
};

export const LEVEL_TO_LABEL: Record<string, (typeof SENIORITY_OPTIONS)[number]> = {
  ENTRY: "Junior",
  MID: "Mid",
  SENIOR: "Senior",
  LEAD: "Staff",
  EXECUTIVE: "Principal / Lead",
};

export const TIMEZONE_OPTIONS = [
  "UTC+7 (Hanoi · Bangkok · Jakarta)",
  "UTC+8 (Singapore · Manila · KL)",
  "UTC+9 (Tokyo · Seoul)",
  "UTC+10 (Sydney · Melbourne)",
] as const;

export const normalizeUrl = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};
