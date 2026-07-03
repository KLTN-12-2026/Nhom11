import type { ExperienceLevel, JobType, PlanType } from "@/types/job";

export const COMPANY_SIZE_OPTIONS = ["1–10", "11–50", "51–200", "201–500", "500+"] as const;

export const HQ_OPTIONS = [
  "🇸🇬 Singapore",
  "🇦🇺 Australia",
  "🇺🇸 United States",
  "🇬🇧 UK",
  "🇪🇺 Europe",
  "Other",
] as const;

export function hqToCountry(hq: string): string | undefined {
  const stripped = hq.replace(/[^a-zA-Z ]/g, "").trim();
  return stripped || undefined;
}

export const SENIORITY_OPTIONS = ["Intern", "Junior", "Mid", "Senior", "Staff", "Lead", "Head"] as const;

export const SENIORITY_TO_LEVEL: Record<(typeof SENIORITY_OPTIONS)[number], ExperienceLevel> = {
  Intern: "ENTRY",
  Junior: "ENTRY",
  Mid: "MID",
  Senior: "SENIOR",
  Staff: "LEAD",
  Lead: "LEAD",
  Head: "EXECUTIVE",
};

export const JOB_TYPE_OPTIONS = ["full", "part", "contract", "freelance"] as const;

export const JOB_TYPE_LABELS: Record<(typeof JOB_TYPE_OPTIONS)[number], string> = {
  full: "Full-time",
  part: "Part-time",
  contract: "Contract",
  freelance: "Freelance",
};

export const JOB_TYPE_TO_ENUM: Record<(typeof JOB_TYPE_OPTIONS)[number], JobType> = {
  full: "FULL_TIME",
  part: "PART_TIME",
  contract: "CONTRACT",
  freelance: "FREELANCE",
};

export const TIMEZONE_OPTIONS = [
  "SG hours · UTC+8",
  "AU hours · UTC+10",
  "US East · UTC-5",
  "US West · UTC-8",
  "EU hours · UTC+1",
  "Async-first",
] as const;

export const LOCATION_OPTIONS = ["remote", "hybrid", "onsite"] as const;

export const CURRENCY_OPTIONS = ["USD", "SGD", "AUD", "EUR", "GBP"] as const;

export const PERIOD_OPTIONS = ["/ month", "/ year", "/ hour"] as const;

export const BENEFIT_OPTIONS = [
  "Health insurance",
  "Equity",
  "Home-office stipend",
  "Annual learning budget",
  "Flexible hours",
  "Team retreats",
  "Equipment provided",
];

export const SKILL_SUGGESTIONS = [
  "React",
  "TypeScript",
  "Node.js",
  "Postgres",
  "GraphQL",
  "AWS",
  "Go",
  "Python",
  "Figma",
  "Kubernetes",
];

export type Tier = {
  id: string;
  name: string;
  planType: PlanType;
  price: number;
  desc: string;
  features: string[];
  ribbon: string | null;
  highlight: boolean;
};

// Prices match PLAN_PRICES in remotesea-api (cents: STANDARD=15000, FEATURED=35000, HANDS_ON=120000).
export const TIERS: Tier[] = [
  {
    id: "standard",
    name: "Standard",
    planType: "STANDARD",
    price: 150,
    desc: "Listed for 30 days, basic search placement.",
    features: ["30-day listing", "Search results", "Email apply"],
    ribbon: null,
    highlight: false,
  },
  {
    id: "featured",
    name: "Featured",
    planType: "FEATURED",
    price: 350,
    desc: "Top of search, highlighted card, pushed to newsletter.",
    features: ["60-day listing", "Top placement", "Newsletter blast", "Social share"],
    ribbon: "Popular",
    highlight: true,
  },
  {
    id: "handson",
    name: "Hands-on",
    planType: "HANDS_ON",
    price: 1200,
    desc: "We source & screen candidates for you.",
    features: ["Unlimited listing", "Priority placement", "Sourcing by team", "Slack channel"],
    ribbon: null,
    highlight: false,
  },
];

export type PostJobFormState = {
  coName: string;
  coWeb: string;
  coSize: string;
  coHq: string;
  coTag: string;
  coAbout: string;
  recName: string;
  recRole: string;
  recEmail: string;
  jobTitle: string;
  jobCategoryId: string;
  jobSeniority: (typeof SENIORITY_OPTIONS)[number];
  jobType: (typeof JOB_TYPE_OPTIONS)[number];
  jobLoc: (typeof LOCATION_OPTIONS)[number];
  jobTz: string;
  jobDesc: string;
  jobSkills: string[];
  jobNice: string[];
  salMin: number;
  salMax: number;
  salCur: (typeof CURRENCY_OPTIONS)[number];
  salPer: (typeof PERIOD_OPTIONS)[number];
  benefits: string[];
  tier: string;
};

export const INITIAL_FORM_STATE: PostJobFormState = {
  coName: "",
  coWeb: "",
  coSize: "11–50",
  coHq: "🇸🇬 Singapore",
  coTag: "",
  coAbout: "",
  recName: "",
  recRole: "",
  recEmail: "",
  jobTitle: "",
  jobCategoryId: "",
  jobSeniority: "Senior",
  jobType: "full",
  jobLoc: "remote",
  jobTz: "SG hours · UTC+8",
  jobDesc: "",
  jobSkills: ["React", "TypeScript"],
  jobNice: [],
  salMin: 3500,
  salMax: 5500,
  salCur: "USD",
  salPer: "/ month",
  benefits: ["Health insurance", "Home-office stipend"],
  tier: "featured",
};
