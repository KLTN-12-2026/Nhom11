import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium text-sm leading-none border rounded-8 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:shadow-focus active:translate-y-px whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-600 text-white border-transparent hover:bg-brand-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
        outline: "bg-transparent text-brand-600 border-brand-600 hover:bg-brand-50",
        ghost:
          "bg-transparent text-neutral-600 border-transparent hover:bg-neutral-100 hover:text-neutral-900",
        soft: "bg-neutral-100 text-neutral-900 border-neutral-200 hover:bg-white hover:border-neutral-300",
      },
      size: {
        sm: "h-8  px-3 text-[13px]",
        md: "h-[38px] px-4",
        lg: "h-11 px-5 text-[15px]",
        xl: "h-[52px] px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
