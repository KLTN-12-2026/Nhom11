import { AlertTriangle, Check, X, Zap } from "lucide-react";
import { autoChecks, type AutoState } from "@/features/admin/admin.utils";
import type { AdminJob } from "@/types/admin";

const AUTO_ICON: Record<AutoState, React.ReactNode> = {
  pass: <Check size={12} />,
  warn: <AlertTriangle size={12} />,
  fail: <X size={12} />,
};

const AUTO_COLOR: Record<AutoState, string> = {
  pass: "bg-brand-100 text-brand-700",
  warn: "bg-amber-100 text-amber-700",
  fail: "bg-red-100 text-red-700",
};

interface AutomatedChecksProps {
  job: AdminJob;
}

export const AutomatedChecks = ({ job }: AutomatedChecksProps) => {
  const checks = autoChecks(job);
  const passCount = checks.filter((a) => a.state === "pass").length;

  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          <Zap size={12} /> Automated checks
        </span>
        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-700">
          {passCount}/{checks.length} clean
        </span>
      </div>
      <div className="space-y-1.5">
        {checks.map((a) => (
          <div className="flex items-start gap-2.5" key={a.t}>
            <span className={`mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full ${AUTO_COLOR[a.state]}`}>
              {AUTO_ICON[a.state]}
            </span>
            <div>
              <div className="text-[13px] font-medium text-neutral-800">{a.t}</div>
              <div className="text-[12px] text-neutral-400">{a.d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
