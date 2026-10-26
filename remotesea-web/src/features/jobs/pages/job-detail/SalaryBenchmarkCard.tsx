import type { SalaryBenchmark } from "@/features/salary/salary.api";
import type { Job } from "@/types/job";

const MIN_PERCENTILE = 5;
const MAX_PERCENTILE = 95;
const MIN_BENCH_BAR_PCT = 4;

interface SalaryBenchmarkCardProps {
  job: Job;
  benchmarks: SalaryBenchmark[] | undefined;
}

export const SalaryBenchmarkCard = ({ job, benchmarks }: SalaryBenchmarkCardProps) => {
  const category = job.categories[0]?.category.name ?? "Other";
  const salaryMin = job.salaryMin ?? 0;
  const salaryMax = job.salaryMax ?? 0;

  // Salary benchmark (aggregated from live listings) — ported from app/jobs/[id]/page.tsx
  const bench = benchmarks?.find((b) => b.role === category) ??
    benchmarks?.[0] ?? {
      role: category,
      min: salaryMin,
      mid: Math.round((salaryMin + salaryMax) / 2),
      max: salaryMax,
      count: 1,
    };
  const jobMid = (salaryMin + salaryMax) / 2;
  const benchRange = bench.max - bench.min;
  const benchPos = benchRange ? ((jobMid - bench.min) / benchRange) * 100 : 50;
  const percentile = Math.max(MIN_PERCENTILE, Math.min(MAX_PERCENTILE, Math.round(benchPos)));

  return (
    <div className="rounded-16 border border-neutral-100 bg-white p-5">
      <h4 className="mb-4 text-[13px] font-semibold text-neutral-900">Salary check · {bench.role}</h4>
      <div className="space-y-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="text-neutral-500">This role</span>
            <span className="font-mono font-semibold text-neutral-900">${jobMid.toLocaleString()}/mo</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.max(MIN_BENCH_BAR_PCT, benchPos)}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="text-neutral-500">Market range</span>
            <span className="font-mono text-neutral-500">
              ${bench.min.toLocaleString()}–${bench.max.toLocaleString()}
            </span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-neutral-100">
            <div className="absolute h-full w-full rounded-full bg-neutral-200" />
            <div
              className="absolute top-0 h-full w-0.5 bg-neutral-500"
              style={{ left: `${benchRange ? ((bench.mid - bench.min) / benchRange) * 100 : 50}%` }}
            />
          </div>
        </div>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-neutral-400">
        This offer sits at the <strong className="text-neutral-700">{percentile}th percentile</strong> for{" "}
        {bench.role.toLowerCase()}s based on {bench.count} VN data points.
      </p>
    </div>
  );
};
