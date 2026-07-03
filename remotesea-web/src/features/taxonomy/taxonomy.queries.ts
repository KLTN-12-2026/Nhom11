import { useQuery } from "@tanstack/react-query";
import { listCategories, listSkills } from "@/features/taxonomy/taxonomy.api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    staleTime: 5 * 60_000,
  });
}

export function useSkills(q?: string) {
  return useQuery({
    queryKey: ["skills", q ?? ""],
    queryFn: () => listSkills(q),
    staleTime: 5 * 60_000,
  });
}
