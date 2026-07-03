import { cn } from "@/utils/cn";

type TagProps = React.HTMLAttributes<HTMLSpanElement>;

export function Tag({ className, children, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-4 bg-neutral-100 px-2 py-0.5 text-[12px] font-[450] leading-tight text-neutral-600",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
