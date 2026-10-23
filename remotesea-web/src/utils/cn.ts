import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

const formatCompactNumber = (value: number): string =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export const formatSalary = (min: number, max: number | null, currency = "USD"): string =>
  max
    ? `${currency} ${formatCompactNumber(min)}–${formatCompactNumber(max)}/mo`
    : `${currency} ${formatCompactNumber(min)}+/mo`;

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
