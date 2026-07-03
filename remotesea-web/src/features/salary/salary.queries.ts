import { useQuery } from "@tanstack/react-query";
import { listSalaryBenchmarks } from "@/features/salary/salary.api";

export function useSalaryBenchmarks() {
  return useQuery({
    queryKey: ["salary", "benchmarks"],
    queryFn: listSalaryBenchmarks,
    staleTime: 5 * 60_000,
  });
}
