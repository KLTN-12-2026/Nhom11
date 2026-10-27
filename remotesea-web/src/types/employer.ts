import type { ApplicationStatus } from "@/types/application";
import type { JobStatus, PlanType } from "@/types/job";

export type EmployerProfile = {
  id: string;
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
};

export type EmployerProfileSummary = EmployerProfile & {
  _count: { jobs: number };
  totalApplications: number;
};

export type CreateEmployerProfilePayload = {
  companyName: string;
  websiteUrl?: string;
  description?: string;
  industry?: string;
  size?: string;
  hqCountry?: string;
  hqCity?: string;
};

export type UpdateEmployerProfilePayload = Partial<CreateEmployerProfilePayload> & {
  founded?: number;
  logoUrl?: string;
};

export type EmployerJobListItem = {
  id: string;
  title: string;
  slug: string;
  status: JobStatus;
  planType: PlanType;
  planPaid: boolean;
  viewCount: number;
  applyCount: number;
  publishedAt: string | null;
  createdAt: string;
  _count: { applications: number };
};

export type EmployerJobsResponse = {
  jobs: EmployerJobListItem[];
  stats: { totalApps: number; shortlisted: number; avgTimeToHireInDays: number };
};

export type EmployerApplicant = {
  id: string;
  status: ApplicationStatus;
  appliedAt: string;
  coverLetter: string | null;
  talent: {
    id: string;
    slug: string;
    headline: string | null;
    level: string;
    user: { name: string | null };
    skills: { skill: { id: string; name: string } }[];
  };
};

export type EmployerJobApplicationsResponse = {
  applications: EmployerApplicant[];
  pagination: { page: number; limit: number; total: number; pages: number };
};
