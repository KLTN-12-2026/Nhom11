import { apiClient } from "@/services/api-client";

export type SalaryBenchmark = { role: string; min: number; max: number; mid: number; count: number };

export async function listSalaryBenchmarks(): Promise<SalaryBenchmark[]> {
  const { data } = await apiClient.get<SalaryBenchmark[]>("/salary/benchmarks");
  return data;
}
