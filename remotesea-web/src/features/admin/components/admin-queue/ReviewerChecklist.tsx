import { Check } from "lucide-react";
import { REVIEW_CHECKLIST } from "@/features/admin/admin.utils";

interface ReviewerChecklistProps {
  checkedIndices: Set<number>;
  onToggle: (index: number) => void;
  disabled: boolean;
}

export const ReviewerChecklist = ({ checkedIndices, onToggle, disabled }: ReviewerChecklistProps) => {
  const reqCount = REVIEW_CHECKLIST.length;
  const doneCount = checkedIndices.size;
  const allDone = doneCount === reqCount;

  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          <Check size={12} /> Reviewer checklist
        </span>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
          {doneCount}/{reqCount}
        </span>
      </div>
      <div className="space-y-2">
        {REVIEW_CHECKLIST.map((c, i) => {
          const done = checkedIndices.has(i);
          return (
            <button
              aria-checked={done}
              className={`rounded-10 flex w-full items-start gap-3 border p-3 text-left transition-all disabled:cursor-not-allowed ${done ? "border-brand-200 bg-brand-50" : "border-neutral-100 bg-white hover:border-neutral-200"}`}
              disabled={disabled}
              key={c.label}
              role="checkbox"
              type="button"
              onClick={() => onToggle(i)}
            >
              <span
                className={`mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border-2 ${done ? "border-brand-600 bg-brand-600 text-white" : "border-neutral-200 text-transparent"}`}
              >
                <Check size={11} />
              </span>
              <div className="flex-1">
                <div className={`text-[13px] font-medium ${done ? "text-brand-700" : "text-neutral-800"}`}>
                  {c.label}
                </div>
                <div className="mt-0.5 text-[12px] text-neutral-400">{c.hint}</div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${reqCount ? (doneCount / reqCount) * 100 : 0}%` }} />
        </div>
        <span className="text-[12px] text-neutral-400">
          {allDone ? "All checks complete" : `${reqCount - doneCount} left before approval`}
        </span>
      </div>
    </div>
  );
};
