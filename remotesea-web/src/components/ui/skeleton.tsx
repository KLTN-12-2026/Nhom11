import { cn } from "@/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-8 bg-neutral-100", className)} />;
}
