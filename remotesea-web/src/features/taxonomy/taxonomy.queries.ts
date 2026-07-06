import { useQuery } from "@tanstack/react-query";
import { listCategories, listSkills } from "@/features/taxonomy/taxonomy.api";

const TAXONOMY_STALE_TIME_MS = 5 * 60_000;

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    staleTime: TAXONOMY_STALE_TIME_MS,
  });

export const useSkills = (q?: string) =>
  useQuery({
    queryKey: ["skills", q ?? ""],
    queryFn: () => listSkills(q),
    staleTime: TAXONOMY_STALE_TIME_MS,
  });
