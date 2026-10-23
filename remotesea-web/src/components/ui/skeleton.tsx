import { cn } from "@/utils/cn";

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn("animate-pulse rounded-8 bg-neutral-100", className)} />
);
