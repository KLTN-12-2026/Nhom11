export const EMPHASIS_STYLE = { fontFamily: "var(--font-serif)" };

interface SectionHeadProps {
  eyebrow: string;
  title: React.ReactNode;
  help: string;
}

export const SectionHead = ({ eyebrow, title, help }: SectionHeadProps) => (
  <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_220px]">
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        {eyebrow}
      </p>
      <h2 className="text-[22px] font-semibold text-neutral-900">{title}</h2>
    </div>
    <p className="text-[13px] leading-relaxed text-neutral-500">{help}</p>
  </div>
);
