import { useQuery } from "@tanstack/react-query";
import { listSalaryBenchmarks } from "@/features/salary/salary.api";

const SALARY_BENCHMARKS_STALE_TIME_MS = 5 * 60_000;

export const useSalaryBenchmarks = () =>
  useQuery({
    queryKey: ["salary", "benchmarks"],
    queryFn: listSalaryBenchmarks,
    staleTime: SALARY_BENCHMARKS_STALE_TIME_MS,
  });
