import type { AdminJob } from "@/types/admin";

export const LEVEL_LABELS: Record<string, string> = {
  ENTRY: "Entry",
  MID: "Mid",
  SENIOR: "Senior",
  LEAD: "Lead",
  EXECUTIVE: "Executive",
};

export const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  FREELANCE: "Freelance",
};

export const PLAN_LABELS: Record<string, string> = {
  STANDARD: "Standard",
  FEATURED: "Featured",
  HANDS_ON: "Hands-on",
};

const COLORS = ["#16766F", "#0EA5E9", "#2563EB", "#7C3AED", "#2E9B52", "#EE4D2D", "#00B14F"];

export const colorFor = (s: string): string => {
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) hash += s.charCodeAt(i);
  return COLORS[hash % COLORS.length];
};

const MS_PER_HOUR = 3_600_000;
const HOURS_PER_DAY = 24;

export const hoursSince = (dateString: string): number =>
  Math.floor((Date.now() - new Date(dateString).getTime()) / MS_PER_HOUR);

export const waitFmt = (h: number): string => {
  if (h < HOURS_PER_DAY) return `${h}h`;
  const d = Math.floor(h / HOURS_PER_DAY);
  const r = h % HOURS_PER_DAY;
  return r ? `${d}d ${r}h` : `${d}d`;
};

export const URGENT_WAIT_HOURS = 24;
const WARNING_WAIT_HOURS = 16;

export const waitCls = (h: number): string => {
  if (h >= URGENT_WAIT_HOURS) return "text-red-500";
  if (h >= WARNING_WAIT_HOURS) return "text-amber-500";
  return "text-neutral-400";
};

export type AutoState = "pass" | "fail" | "warn";
export type AutoCheck = { state: AutoState; t: string; d: string };

const MIN_DESCRIPTION_LENGTH = 100;

export const autoChecks = (job: AdminJob): AutoCheck[] => [
  {
    state: job.description.length >= MIN_DESCRIPTION_LENGTH ? "pass" : "fail",
    t: "Description length",
    d: `${job.description.length} characters`,
  },
  {
    state: job.salaryMin ? "pass" : "warn",
    t: "Salary disclosed",
    d: job.salaryMin ? "Range provided" : "No salary range",
  },
  {
    state: job.categories.length ? "pass" : "warn",
    t: "Categorised",
    d: job.categories.length ? "Has category" : "Missing category",
  },
  {
    state: job.employer.isVerified ? "pass" : "warn",
    t: "Employer verified",
    d: job.employer.isVerified ? "Verified company" : "Not yet verified",
  },
];

export const REVIEW_CHECKLIST = [
  { label: "Role is genuinely remote", hint: "Not hybrid mislabeled as remote." },
  { label: "Salary within market band", hint: "Compare against benchmark." },
  { label: "No discriminatory language", hint: "Requirements read clean." },
  { label: "Company looks legitimate", hint: "Website + contact check out." },
];

export const formatSalary = (min: number | null, max: number | null, currency = "USD"): string => {
  if (!min) return "Not specified";
  const fmt = (n: number) => n.toLocaleString();
  return max ? `${currency} ${fmt(min)}–${fmt(max)}` : `${currency} ${fmt(min)}+`;
};
