import { Injectable } from "@nestjs/common";
import type { Job, Prisma } from "@prisma/client";
import { PrismaService } from "@/core/database/prisma.service";
import {
  jobWithEmployerEmailInclude,
  type JobWithEmployerEmail,
} from "@/common/types/job-with-employer-email.type";

const jobWithEmployerUserIdInclude = {
  employer: { select: { userId: true } },
} satisfies Prisma.JobInclude;

type JobWithEmployerUserId = Prisma.JobGetPayload<{ include: typeof jobWithEmployerUserIdInclude }>;

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findJobWithEmployer(jobId: string): Promise<JobWithEmployerUserId | null> {
    return this.prisma.job.findUnique({
      where: { id: jobId },
      include: jobWithEmployerUserIdInclude,
    });
  }

  setStripeSessionId(jobId: string, stripeSessionId: string): Promise<Job> {
    return this.prisma.job.update({
      where: { id: jobId },
      data: { stripeSessionId },
    });
  }

  markJobPaidAndSubmitted(jobId: string): Promise<JobWithEmployerEmail> {
    return this.prisma.job.update({
      where: { id: jobId },
      data: { planPaid: true, paidAt: new Date(), status: "PENDING_REVIEW" },
      include: jobWithEmployerEmailInclude,
    });
  }
}
