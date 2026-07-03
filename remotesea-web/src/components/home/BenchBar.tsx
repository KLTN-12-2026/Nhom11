import { useState } from "react";

export function BenchBar({
  min,
  mid,
  max,
  globalMax,
}: {
  min: number;
  mid: number;
  max: number;
  globalMax: number;
}) {
  const [hovered, setHovered] = useState(false);
  const left = (min / globalMax) * 100;
  const width = ((max - min) / globalMax) * 100;
  const midPos = max > min ? ((mid - min) / (max - min)) * 100 : 100;

  return (
    <div className="relative h-3 w-full">
      <div
        className="absolute inset-y-0 rounded-full bg-white/10"
        style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
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
}
