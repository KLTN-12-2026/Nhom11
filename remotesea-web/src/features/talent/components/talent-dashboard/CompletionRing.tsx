interface CompletionRingProps {
  pct: number;
}

const RADIUS = 24;

export const CompletionRing = ({ pct }: CompletionRingProps) => {
  const circumference = 2 * Math.PI * RADIUS;
  const offset = circumference - (circumference * pct) / 100;
  return (
    <div className="relative flex-shrink-0">
      <svg height="58" viewBox="0 0 58 58" width="58">
        <circle className="stroke-neutral-100" cx="29" cy="29" fill="none" r={RADIUS} strokeWidth="5" />
        <circle
          className="stroke-brand-600"
          cx="29"
          cy="29"
          fill="none"
          r={RADIUS}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="5"
          style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-mono text-[13px] font-semibold text-neutral-900">
        {pct}%
      </div>
    </div>
  );
};
