import { cn } from "@/utils/cn";

interface CompanyLogoProps {
  initial: string;
  color: string;
  size?: number;
  className?: string;
}

const LARGE_LOGO_SIZE = 56;
const MEDIUM_LOGO_SIZE = 40;
const LARGE_RADIUS = 14;
const MEDIUM_RADIUS = 10;
const SMALL_RADIUS = 8;
const FONT_SIZE_RATIO = 0.4;

const getLogoRadius = (size: number): number => {
  if (size >= LARGE_LOGO_SIZE) return LARGE_RADIUS;
  if (size >= MEDIUM_LOGO_SIZE) return MEDIUM_RADIUS;
  return SMALL_RADIUS;
};

export const CompanyLogo = ({ initial, color, size = 44, className }: CompanyLogoProps) => (
  <div
    className={cn("grid flex-shrink-0 place-items-center font-semibold text-white", className)}
    style={{
      width: size,
      height: size,
      background: color,
      borderRadius: getLogoRadius(size),
      fontSize: size * FONT_SIZE_RATIO,
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)",
      letterSpacing: "-0.02em",
    }}
  >
    {initial}
  </div>
);
