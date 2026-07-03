import { cn } from "@/utils/cn";

type CompanyLogoProps = {
  initial: string;
  color: string;
  size?: number;
  className?: string;
};

export function CompanyLogo({ initial, color, size = 44, className }: CompanyLogoProps) {
  const radius = size >= 56 ? 14 : size >= 40 ? 10 : 8;
  return (
    <div
      className={cn("grid flex-shrink-0 place-items-center font-semibold text-white", className)}
      style={{
        width: size,
        height: size,
        background: color,
        borderRadius: radius,
        fontSize: size * 0.4,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)",
        letterSpacing: "-0.02em",
      }}
    >
      {initial}
    </div>
  );
}
