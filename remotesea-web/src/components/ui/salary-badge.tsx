import { cn } from "@/utils/cn";

interface SalaryBadgeProps {
  min: number;
  max: number;
  unit?: string;
  className?: string;
}

export const SalaryBadge = ({ min, max, unit = "/mo", className }: SalaryBadgeProps) => (
  <span
    className={cn(
      "whitespace-nowrap rounded-8 bg-amber-100 px-2 py-1 font-mono text-[13px] font-semibold tracking-tight text-amber-700",
      className
    )}
  >
    ${min.toLocaleString()}–{max.toLocaleString()}
    {unit}
  </span>
);
