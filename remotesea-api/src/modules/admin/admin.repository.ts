import { Injectable } from "@nestjs/common";
import type { EmployerProfile, Job, JobStatus, PlanType, Prisma } from "@prisma/client";
import { PrismaService } from "@/core/database/prisma.service";
import { jobWithEmployerEmailInclude } from "@/common/types/job-with-employer-email.type";

const employerListInclude = {
  user: { select: { email: true } },
  _count: { select: { jobs: true } },
  jobs: { where: { planPaid: true }, select: { planType: true } },
} satisfies Prisma.EmployerProfileInclude;

type EmployerListItem = Prisma.EmployerProfileGetPayload<{ include: typeof employerListInclude }>;

const jobListInclude = {
  employer: { select: { companyName: true, isVerified: true, slug: true } },
  categories: { include: { category: true } },
} satisfies Prisma.JobInclude;

type JobListItem = Prisma.JobGetPayload<{ include: typeof jobListInclude }>;

const paidJobRevenueSelect = {
  id: true,
  title: true,
  planType: true,
  paidAt: true,
  createdAt: true,
  employer: { select: { companyName: true } },
} satisfies Prisma.JobSelect;

export type PaidJobRevenueRow = Prisma.JobGetPayload<{ select: typeof paidJobRevenueSelect }>;

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEmployers(
    where: { isVerified?: boolean },
    skip: number,
    take: number
  ): Promise<[EmployerListItem[], number]> {
    return Promise.all([
      this.prisma.employerProfile.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: employerListInclude,
      }),
      this.prisma.employerProfile.count({ where }),
    ]);
  }

  findEmployerById(id: string): Promise<Pick<EmployerProfile, "id"> | null> {
    return this.prisma.employerProfile.findUnique({ where: { id }, select: { id: true } });
  }

  verifyEmployer(id: string): Promise<EmployerProfile> {
    return this.prisma.employerProfile.update({ where: { id }, data: { isVerified: true } });
  }

  async suspendEmployer(id: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.employerProfile.update({ where: { id }, data: { isVerified: false } }),
      this.prisma.job.updateMany({ where: { employerId: id, status: "ACTIVE" }, data: { status: "CLOSED" } }),
    ]);
  }

  findJobs(where: { status: JobStatus }, skip: number, take: number): Promise<[JobListItem[], number]> {
    return Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "asc" },
        include: jobListInclude,
      }),
      this.prisma.job.count({ where }),
    ]);
  }

  findJobWithEmployerEmail(id: string) {
    return this.prisma.job.findUnique({
      where: { id },
      include: jobWithEmployerEmailInclude,
    });
  }

  approveJob(id: string): Promise<Pick<Job, "status" | "publishedAt">> {
    return this.prisma.job.update({
      where: { id },
      data: { status: "ACTIVE", publishedAt: new Date(), reviewNote: null },
      select: { status: true, publishedAt: true },
    });
  }

  rejectJob(id: string, note: string | null): Promise<Pick<Job, "status" | "publishedAt">> {
    return this.prisma.job.update({
      where: { id },
      data: { status: "REJECTED", reviewNote: note },
      select: { status: true, publishedAt: true },
    });
  }

  async countPaidJobsByPlan(): Promise<Array<{ planType: PlanType; count: number }>> {
    const rows = await this.prisma.job.groupBy({
      by: ["planType"],
      where: { planPaid: true },
      _count: true,
    });
    return rows.map((row) => ({ planType: row.planType, count: row._count }));
  }

  findPaidJobsSince(since: Date): Promise<Array<Pick<Job, "planType" | "paidAt" | "createdAt">>> {
    return this.prisma.job.findMany({
      where: {
        planPaid: true,
        OR: [{ paidAt: { gte: since } }, { paidAt: null, createdAt: { gte: since } }],
      },
      select: { planType: true, paidAt: true, createdAt: true },
    });
  }

  findRecentPaidJobs(limit: number): Promise<PaidJobRevenueRow[]> {
    return this.prisma.job.findMany({
      where: { planPaid: true },
      select: paidJobRevenueSelect,
      orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
  }
}
