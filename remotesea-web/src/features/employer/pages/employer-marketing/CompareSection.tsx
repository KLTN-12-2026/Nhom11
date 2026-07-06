import { Check, Minus } from "lucide-react";

const COMPARE = [
  { f: "VN-specific talent pool", us: true, li: false, ro: false, up: "partial" },
  { f: "Salary range required", us: true, li: false, ro: "partial", up: false },
  { f: "Verified employer signal", us: true, li: false, ro: false, up: "partial" },
  { f: "Direct line to founder", us: true, li: false, ro: false, up: false },
  { f: "Pay per post (vs subscription)", us: true, li: false, ro: true, up: true },
  { f: "Hands-on screening option", us: true, li: false, ro: false, up: false },
  { f: "Money-back guarantee", us: true, li: false, ro: false, up: false },
];

const COMPARE_COLUMNS = ["RemoteSEA", "LinkedIn", "RemoteOK", "Upwork"];

type CellValue = boolean | "partial";

interface CompareCellProps {
  v: CellValue;
  highlight?: boolean;
}

const CompareCell = ({ v, highlight }: CompareCellProps) => {
  if (v === true) {
    return (
      <span className={`inline-grid h-7 w-7 place-items-center rounded-full ${highlight ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-400"}`}>
        <Check size={13} />
      </span>
    );
  }
  if (v === false) {
    return (
      <span className="inline-grid h-7 w-7 place-items-center rounded-full text-neutral-300">
        <Minus size={13} />
      </span>
    );
  }
  return <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700">partial</span>;
};

export const CompareSection = () => (
  <section className="pb-20">
    <div className="mx-auto max-w-[1240px] px-6">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Side by side</p>
      <h2 className="mb-8 text-[32px] font-semibold tracking-tight text-neutral-900">
        Versus the{" "}
        <em className="font-serif-italic">
          alternatives.
        </em>
      </h2>
      <div className="overflow-hidden rounded-24 border border-neutral-100 bg-white">
        <div className="grid grid-cols-[1.4fr_repeat(4,1fr)] border-b border-neutral-100 bg-neutral-50">
          <div className="px-5 py-4" />
          {COMPARE_COLUMNS.map((col, i) => (
            <div
              className={`px-5 py-4 text-center text-[12px] font-semibold uppercase tracking-wider ${i === 0 ? "border-x border-brand-100 bg-gradient-to-b from-brand-50 to-transparent text-brand-700" : "text-neutral-400"}`}
              key={col}
            >
              {col}
            </div>
          ))}
        </div>
        {COMPARE.map((row, i) => (
          <div className={`grid grid-cols-[1.4fr_repeat(4,1fr)] border-b border-neutral-100 last:border-none ${i % 2 === 1 ? "bg-neutral-50/50" : ""}`} key={row.f}>
            <div className="px-5 py-4 text-[14px] font-medium text-neutral-800">{row.f}</div>
            <div className="flex items-center justify-center border-x border-brand-100 bg-gradient-to-b from-brand-50/30 to-transparent px-5 py-4">
              <CompareCell highlight v={row.us as CellValue} />
            </div>
            {[row.li, row.ro, row.up].map((v, j) => (
              <div className="flex items-center justify-center px-5 py-4" key={j}>
                <CompareCell v={v as CellValue} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </section>
);
