import type { Prisma } from "@prisma/client";
import type { jobWithRelationsInclude } from "@/common/types/job-with-relations.type";

export type ApplicationWithJob = Prisma.ApplicationGetPayload<{
  include: { job: { include: typeof jobWithRelationsInclude } };
}>;

export type CreateApplicationInput = {
  jobId: string;
  talentId: string;
  coverLetter?: string;
  resumeUrl?: string;
};
