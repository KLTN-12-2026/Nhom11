import type { ExperienceLevel, JobType } from "@/types/job";

export const JOB_LIMIT = 12;

export const SALARY_FLOOR = 500;
export const SALARY_CEIL = 8000;

export type SortKey = "recent" | "salary" | "featured";
const SORTS: SortKey[] = ["recent", "salary", "featured"];

// UI-facing filter vocabulary, ported from remotesea/src/lib/job-filters.ts —
// GET /jobs now accepts arrays (repeated query keys) + salaryMin/salaryMax +
// timezone buckets + sort, so this restores the original's full filter set.
export type Filters = {
  jobType: string[];
  timezone: string[];
  category: string[];
  seniority: string[];
  salaryMin: number;
  salaryMax: number;
};

export const DEFAULT_FILTERS: Filters = {
  jobType: [],
  timezone: [],
  category: [],
  seniority: [],
  salaryMin: SALARY_FLOOR,
  salaryMax: SALARY_CEIL,
};

export type JobFilters = { filters: Filters; q: string; sort: SortKey; page: number };

export const DEFAULT_JOB_FILTERS: JobFilters = {
  filters: DEFAULT_FILTERS,
  q: "",
  sort: "recent",
  page: 1,
};

// UI label → raw enum(s) sent to the API — ported from JOBTYPE_TO_ENUMS/SENIORITY_TO_LEVELS.
export const JOBTYPE_TO_ENUMS: Record<string, JobType[]> = {
  "Full-time": ["FULL_TIME"],
  Contract: ["CONTRACT", "FREELANCE"],
  "Part-time": ["PART_TIME"],
};

export const SENIORITY_TO_LEVELS: Record<string, ExperienceLevel[]> = {
  Entry: ["ENTRY"],
  Mid: ["MID"],
  Senior: ["SENIOR", "LEAD", "EXECUTIVE"],
};

export const FILTER_OPTIONS = {
  jobType: ["Full-time", "Contract", "Part-time"],
  timezone: ["sea", "async", "SG", "AU", "US"],
  seniority: ["Entry", "Mid", "Senior"],
  category: ["Engineering", "Design", "Data", "Product", "Marketing"],
};

function toArray(value: string[] | undefined): string[] {
  return value ?? [];
}

export function parseJobQuery(params: URLSearchParams): JobFilters {
  const sortRaw = params.get("sort") as SortKey | null;
  const salaryMin = Number(params.get("salaryMin")) || SALARY_FLOOR;
  const salaryMax = Number(params.get("salaryMax")) || SALARY_CEIL;

  return {
    q: params.get("q") ?? "",
    sort: sortRaw && SORTS.includes(sortRaw) ? sortRaw : "recent",
    page: Math.max(1, Number(params.get("page")) || 1),
    filters: {
      jobType: toArray(params.getAll("type")),
      timezone: toArray(params.getAll("tz")),
      seniority: toArray(params.getAll("level")),
      category: toArray(params.getAll("category")),
      salaryMin,
      salaryMax,
    },
  };
}

export function serializeJobQuery(query: JobFilters): string {
  const p = new URLSearchParams();
  if (query.q) p.set("q", query.q);
  query.filters.jobType.forEach((v) => p.append("type", v));
  query.filters.timezone.forEach((v) => p.append("tz", v));
  query.filters.seniority.forEach((v) => p.append("level", v));
  query.filters.category.forEach((v) => p.append("category", v));
  if (query.filters.salaryMin > SALARY_FLOOR) p.set("salaryMin", String(query.filters.salaryMin));
  if (query.filters.salaryMax < SALARY_CEIL) p.set("salaryMax", String(query.filters.salaryMax));
  if (query.sort !== "recent") p.set("sort", query.sort);
  if (query.page > 1) p.set("page", String(query.page));
  return p.toString();
}

export function countActiveFilters(filters: Filters): number {
  return (
    filters.jobType.length +
    filters.timezone.length +
    filters.category.length +
    filters.seniority.length +
    (filters.salaryMin > SALARY_FLOOR || filters.salaryMax < SALARY_CEIL ? 1 : 0)
  );
}
