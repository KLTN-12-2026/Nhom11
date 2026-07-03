import { cn } from "@/utils/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      aria-label="Loading"
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-brand-600",
        className
      )}
      role="status"
    />
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
