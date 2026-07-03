import type { ExperienceLevel, JobType } from "@/types/job";

export const LEVEL_LABELS: Record<ExperienceLevel, string> = {
  ENTRY: "Entry",
  MID: "Mid",
  SENIOR: "Senior",
  LEAD: "Lead",
  EXECUTIVE: "Executive",
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  FREELANCE: "Freelance",
};

const COUNTRY_FLAGS: Record<string, string> = {
  Singapore: "🇸🇬",
  Vietnam: "🇻🇳",
  Australia: "🇦🇺",
  "United States": "🇺🇸",
  Indonesia: "🇮🇩",
  Philippines: "🇵🇭",
  Malaysia: "🇲🇾",
  Thailand: "🇹🇭",
};

const COMPANY_COLORS = [
  "#16a34a",
  "#5E6AD2",
  "#00C4CC",
  "#635BFF",
  "#EE4D2D",
  "#7C3AED",
  "#0EA5E9",
  "#B45309",
];

export function companyColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash += name.charCodeAt(i);
  return COMPANY_COLORS[hash % COMPANY_COLORS.length];
}

export function countryFlag(country: string | null): string {
  if (!country) return "🌏";
  return COUNTRY_FLAGS[country] ?? "🌏";
}

export function isAsyncTimezone(timezone: string | null): boolean {
  return timezone?.toLowerCase().includes("async") ?? false;
}

export function timeAgo(dateString: string | null): string {
  if (!dateString) return "just now";
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours >= 1) return `${hours}h`;
  return "just now";
}
