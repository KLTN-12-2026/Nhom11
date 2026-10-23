import type { Job } from "@/types/job";

export type ApplicationStatus =
  | "PENDING"
  | "REVIEWING"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "OFFERED"
  | "REJECTED"
  | "WITHDRAWN";

export type Application = {
  id: string;
  jobId: string;
  talentId: string;
  coverLetter: string | null;
  resumeUrl: string | null;
  status: ApplicationStatus;
  notes: string | null;
  appliedAt: string;
  updatedAt: string;
};

export type ApplicationWithJob = Application & { job: Job };
