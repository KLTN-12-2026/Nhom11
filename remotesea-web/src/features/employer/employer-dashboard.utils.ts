import type { ApplicationStatus } from "@/types/application";
import type { JobStatus } from "@/types/job";

export type ListingStatusGroup = "review" | "live" | "closed";
export type ApplicantStatusGroup = "new" | "reviewing" | "shortlisted" | "archived";

export const STATUS_GROUP: Record<JobStatus, ListingStatusGroup> = {
  DRAFT: "review",
  PENDING_REVIEW: "review",
  ACTIVE: "live",
  CLOSED: "closed",
  REJECTED: "closed",
};

export const STATUS_LABEL: Record<JobStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "In review",
  ACTIVE: "Live",
  CLOSED: "Filled",
  REJECTED: "Rejected",
};

export const APPLICANT_STATUS: Record<ApplicationStatus, ApplicantStatusGroup> = {
  PENDING: "new",
  REVIEWING: "reviewing",
  SHORTLISTED: "shortlisted",
  INTERVIEW: "shortlisted",
  OFFERED: "shortlisted",
  REJECTED: "archived",
  WITHDRAWN: "archived",
};

export const NEXT_STAGE: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  PENDING: "REVIEWING",
  REVIEWING: "SHORTLISTED",
  SHORTLISTED: "INTERVIEW",
  INTERVIEW: "OFFERED",
};

export const NEXT_LABEL: Partial<Record<ApplicationStatus, string>> = {
  PENDING: "Review",
  REVIEWING: "Shortlist",
  SHORTLISTED: "Interview",
  INTERVIEW: "Offer",
};

const COLORS = ["#1F8A3A", "#2684FF", "#E97560", "#7C3AED", "#0EA5E9", "#B45309"];

export const colorFor = (s: string): string => {
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) hash += s.charCodeAt(i);
  return COLORS[hash % COLORS.length];
};

const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;

export const timeAgo = (dateString: string | null): string => {
  if (!dateString) return "just now";
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / MS_PER_DAY);
  if (days >= 1) return `${days}d ago`;
  const hours = Math.floor(diff / MS_PER_HOUR);
  if (hours >= 1) return `${hours}h ago`;
  return "Just now";
};
