import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-full leading-tight whitespace-nowrap",
  {
    variants: {
      variant: {
        verified: "bg-brand-50 text-brand-700",
        featured: "bg-amber-100 text-amber-700",
        vn: "bg-blue-50 text-blue-700",
        new: "bg-brand-100 text-brand-700",
        muted: "bg-neutral-100 text-neutral-600",
      },
    },
    defaultVariants: { variant: "muted" },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);
