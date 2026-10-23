import { useState } from "react";

interface BenchBarProps {
  min: number;
  mid: number;
  max: number;
  globalMax: number;
}

const MIN_BAR_WIDTH_PCT = 2;
const FULL_WIDTH_PCT = 100;

export const BenchBar = ({ min, mid, max, globalMax }: BenchBarProps) => {
  const [hovered, setHovered] = useState(false);
  const left = (min / globalMax) * FULL_WIDTH_PCT;
  const width = ((max - min) / globalMax) * FULL_WIDTH_PCT;
  const midPos = max > min ? ((mid - min) / (max - min)) * FULL_WIDTH_PCT : FULL_WIDTH_PCT;

  return (
    <div className="relative h-3 w-full">
      <div
        className="absolute inset-y-0 rounded-full bg-white/10"
        style={{ left: `${left}%`, width: `${Math.max(width, MIN_BAR_WIDTH_PCT)}%` }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-brand-400 transition-all duration-300"
          style={{ width: hovered ? "100%" : `${midPos}%` }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        />
        <div
          className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-white/60"
          style={{ left: `${midPos}%` }}
        />
      </div>
    </div>
  );
};
