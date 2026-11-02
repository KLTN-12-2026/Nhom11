import type { Prisma } from "@prisma/client";
import type { jobWithRelationsInclude } from "@/common/types/job-with-relations.type";

export type SavedJobWithJob = Prisma.SavedJobGetPayload<{
  include: { job: { include: typeof jobWithRelationsInclude } };
}>;

export type ToggleSavedResult = { saved: boolean };
