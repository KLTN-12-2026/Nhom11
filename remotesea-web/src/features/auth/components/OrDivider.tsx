interface OrDividerProps {
  label: string;
}

export const OrDivider = ({ label }: OrDividerProps) => (
  <div className="mb-6 flex items-center gap-3">
    <div className="h-px flex-1 bg-neutral-200" />
    <span className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">{label}</span>
    <div className="h-px flex-1 bg-neutral-200" />
  </div>
);
