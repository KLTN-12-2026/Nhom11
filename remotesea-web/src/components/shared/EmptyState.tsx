import { cn } from "@/utils/cn";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({ title, description, action, className }: EmptyStateProps) => (
  <div className={cn("text-center text-neutral-500", className ?? "py-16")}>
    <p className="mb-1 font-medium text-neutral-900">{title}</p>
    <p className={action ? "mb-4 text-sm" : "text-sm"}>{description}</p>
    {action}
  </div>
);
