import { cn } from "@/utils/cn";

interface ToggleProps {
  on: boolean;
  onChange: (value: boolean) => void;
}

export const Toggle = ({ on, onChange }: ToggleProps) => (
  <button
    aria-checked={on}
    className={cn(
      "relative h-6 w-11 flex-shrink-0 rounded-full border transition-colors",
      on ? "border-brand-600 bg-brand-600" : "border-neutral-300 bg-neutral-100"
    )}
    role="switch"
    type="button"
    onClick={() => onChange(!on)}
  >
    <span
      className={cn(
        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
        on ? "translate-x-5" : "translate-x-0.5"
      )}
    />
  </button>
);
