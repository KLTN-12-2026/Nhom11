import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";
import { useCategories } from "@/features/taxonomy/taxonomy.queries";
import {
  DEFAULT_FILTERS,
  FILTER_OPTIONS,
  SALARY_CEIL,
  SALARY_FLOOR,
  countActiveFilters,
  type Filters,
} from "@/features/jobs/job-filters";
import type { JobFacets } from "@/types/job";

type FilterSidebarProps = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  facets: JobFacets;
};

function CheckRow({
  checked,
  label,
  count,
  onToggle,
}: {
  checked: boolean;
  label: string;
  count: number;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 py-1.5 text-[13.5px] transition-colors",
        checked ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-900"
      )}
      onClick={onToggle}
    >
      <span
        className={cn(
          "grid h-4 w-4 flex-shrink-0 place-items-center rounded-[4px] border transition-all",
          checked ? "border-brand-600 bg-brand-600" : "border-neutral-300 bg-white"
        )}
      >
        {checked && <Check className="text-white" size={10} strokeWidth={3} />}
      </span>
      <span className="flex-1">{label}</span>
      <span className="text-[11px] tabular-nums text-neutral-400">{count}</span>
    </label>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-neutral-100 py-4 last:border-0">
      <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-widest text-neutral-400">
        {label}
      </div>
      {children}
    </div>
  );
}

const TIMEZONE_OPTIONS = [
  { key: "sea", label: "SEA / APAC (UTC+7 to +10)" },
  { key: "async", label: "Async-friendly" },
  { key: "SG", label: "SG-based company" },
  { key: "AU", label: "AU-based company" },
  { key: "US", label: "US-based company" },
] as const;

const SENIORITY_OPTIONS = [
  { key: "Entry", label: "Entry (0–2 yrs)" },
  { key: "Mid", label: "Mid (2–5 yrs)" },
  { key: "Senior", label: "Senior (5+ yrs)" },
] as const;

export function FilterSidebar({ filters, onChange, facets }: FilterSidebarProps) {
  const { data: categories } = useCategories();
  const activeCount = countActiveFilters(filters);

  const toggle = (key: keyof Pick<Filters, "jobType" | "timezone" | "category" | "seniority">, val: string) => {
    const current = filters[key];
    onChange({
      ...filters,
      [key]: current.includes(val) ? current.filter((v) => v !== val) : [...current, val],
    });
  };

  // Local salary state so dragging the sliders doesn't refetch per step; commit on release.
  const [salary, setSalary] = useState({ min: filters.salaryMin, max: filters.salaryMax });
  useEffect(() => {
    setSalary({ min: filters.salaryMin, max: filters.salaryMax });
  }, [filters.salaryMin, filters.salaryMax]);
  const commitSalary = () => onChange({ ...filters, salaryMin: salary.min, salaryMax: salary.max });

  const slugForCategoryName = (name: string) => categories?.find((c) => c.name === name)?.slug;

  return (
    <aside className="w-[220px] flex-shrink-0">
      <div className="mb-1 flex items-center justify-between py-2">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900">
          Filters
          {activeCount > 0 && (
            <span className="grid h-4 w-4 place-items-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </h3>
        {activeCount > 0 && (
          <button
            className="text-[12px] text-brand-600 transition-colors hover:text-brand-700"
            onClick={() => onChange(DEFAULT_FILTERS)}
          >
            Clear all
          </button>
        )}
      </div>

      <FilterGroup label="Job type">
        {FILTER_OPTIONS.jobType.map((v) => (
          <CheckRow
            checked={filters.jobType.includes(v)}
            count={facets.jobType[v] ?? 0}
            key={v}
            label={v === "Contract" ? "Contract / Freelance" : v}
            onToggle={() => toggle("jobType", v)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Timezone / Location">
        {TIMEZONE_OPTIONS.map(({ key, label }) => (
          <CheckRow
            checked={filters.timezone.includes(key)}
            count={facets.timezone[key] ?? 0}
            key={key}
            label={label}
            onToggle={() => toggle("timezone", key)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Salary range">
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-[12px] text-neutral-500">
            <span>${salary.min.toLocaleString()}</span>
            <span>
              ${salary.max.toLocaleString()}
              {salary.max >= SALARY_CEIL ? "+" : ""}/mo
            </span>
          </div>
          <input
            className="w-full accent-brand-600"
            max={SALARY_CEIL}
            min={SALARY_FLOOR}
            step={100}
            type="range"
            value={salary.min}
            onChange={(e) => setSalary((s) => ({ ...s, min: Math.min(+e.target.value, s.max - 500) }))}
            onKeyUp={commitSalary}
            onMouseUp={commitSalary}
            onTouchEnd={commitSalary}
          />
          <input
            className="w-full accent-brand-600"
            max={SALARY_CEIL}
            min={SALARY_FLOOR}
            step={100}
            type="range"
            value={salary.max}
            onChange={(e) => setSalary((s) => ({ ...s, max: Math.max(+e.target.value, s.min + 500) }))}
            onKeyUp={commitSalary}
            onMouseUp={commitSalary}
            onTouchEnd={commitSalary}
          />
        </div>
      </FilterGroup>

      <FilterGroup label="Seniority">
        {SENIORITY_OPTIONS.map(({ key, label }) => (
          <CheckRow
            checked={filters.seniority.includes(key)}
            count={facets.seniority[key] ?? 0}
            key={key}
            label={label}
            onToggle={() => toggle("seniority", key)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Category">
        {FILTER_OPTIONS.category.map((name) => {
          const slug = slugForCategoryName(name);
          return (
            <CheckRow
              checked={!!slug && filters.category.includes(slug)}
              count={facets.category[name] ?? 0}
              key={name}
              label={name}
              onToggle={() => slug && toggle("category", slug)}
            />
          );
        })}
      </FilterGroup>
    </aside>
  );
}
