import { Flag, Shield } from "lucide-react";

type VerifiedBadgeSize = "sm" | "md";

interface VerifiedBadgeProps {
  isVerified: boolean;
  label?: string;
  size?: VerifiedBadgeSize;
}

const SIZE_CLASSES: Record<
  VerifiedBadgeSize,
  { gap: string; padding: string; text: string; verifiedIcon: number; unverifiedIcon: number }
> = {
  sm: { gap: "gap-0.5", padding: "px-1.5", text: "text-[10px]", verifiedIcon: 9, unverifiedIcon: 8 },
  md: { gap: "gap-1", padding: "px-2", text: "text-[11px]", verifiedIcon: 10, unverifiedIcon: 9 },
};

export const VerifiedBadge = ({ isVerified, label, size = "sm" }: VerifiedBadgeProps) => {
  const { gap, padding, text, verifiedIcon, unverifiedIcon } = SIZE_CLASSES[size];

  if (isVerified) {
    return (
      <span className={`inline-flex items-center ${gap} rounded-full bg-brand-100 ${padding} py-0.5 ${text} font-medium text-brand-700`}>
        <Shield size={verifiedIcon} /> {label ?? "Verified"}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${gap} rounded-full bg-red-50 ${padding} py-0.5 ${text} text-red-600`}>
      <Flag size={unverifiedIcon} /> {label ?? "Unverified"}
    </span>
  );
};
