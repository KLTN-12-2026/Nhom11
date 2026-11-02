import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "@/core/database/prisma.service";

const categorySalarySelect = {
  name: true,
  jobs: {
    where: { job: { status: "ACTIVE", salaryMin: { not: null } } },
    select: { job: { select: { salaryMin: true, salaryMax: true } } },
  },
} satisfies Prisma.CategorySelect;

export type CategoryWithActiveJobSalaries = Prisma.CategoryGetPayload<{
  select: typeof categorySalarySelect;
}>;

@Injectable()
export class SalaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCategoriesWithActiveJobSalaries(): Promise<CategoryWithActiveJobSalaries[]> {
    return this.prisma.category.findMany({
      select: categorySalarySelect,
    });
  }
}
