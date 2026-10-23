import type { Category, ExperienceLevel, JobStatus, JobType, PlanType } from "@/types/job";

export type AdminJob = {
  id: string;
  employerId: string;
  title: string;
  slug: string;
  description: string;
  requirements: string | null;
  jobType: JobType;
  level: ExperienceLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  isRemote: boolean;
  timezone: string | null;
  country: string | null;
  status: JobStatus;
  planType: PlanType;
  planPaid: boolean;
  benefits: string[];
  vnHireCount: number;
  reviewNote: string | null;
  isFeatured: boolean;
  viewCount: number;
  applyCount: number;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  employer: { companyName: string; isVerified: boolean; slug: string };
  categories: { category: Category }[];
};

export type AdminJobsResponse = {
  jobs: AdminJob[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

export type AdminEmployer = {
  id: string;
  userId: string;
  companyName: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  description: string | null;
  industry: string | null;
  size: string | null;
  founded: number | null;
  hqCountry: string | null;
  hqCity: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user: { email: string };
  _count: { jobs: number };
  jobCount: number;
  totalSpend: number;
};

export type AdminEmployersResponse = {
  employers: AdminEmployer[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

export type RevenueMonthBucket = {
  key: string;
  label: string;
  standard: number;
  featured: number;
  handsOn: number;
};

export type RevenuePlanMix = {
  planType: PlanType;
  label: string;
  price: number;
  count: number;
  amount: number;
};

export type RevenueTransaction = {
  jobId: string;
  jobTitle: string;
  companyName: string;
  planType: PlanType;
  amount: number;
  paidAt: string;
};

export type RevenueResponse = {
  months: RevenueMonthBucket[];
  mix: RevenuePlanMix[];
  transactions: RevenueTransaction[];
  totals: { allTime: number; thisMonth: number };
};
