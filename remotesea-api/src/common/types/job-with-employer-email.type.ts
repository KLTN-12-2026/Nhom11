import type { Prisma } from "@prisma/client";

export const jobWithEmployerEmailInclude = {
  employer: { include: { user: { select: { email: true } } } },
} satisfies Prisma.JobInclude;

export type JobWithEmployerEmail = Prisma.JobGetPayload<{ include: typeof jobWithEmployerEmailInclude }>;
