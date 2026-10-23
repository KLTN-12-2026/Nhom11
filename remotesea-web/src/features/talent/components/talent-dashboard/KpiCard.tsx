interface KpiCardProps {
  label: string;
  icon: React.ElementType;
  value: string;
  sub: string;
}

export const KpiCard = ({ label, icon: Icon, value, sub }: KpiCardProps) => (
  <div className="rounded-16 border border-neutral-100 bg-white p-5">
    <div className="mb-3 flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">{label}</span>
      <Icon className="text-neutral-300" size={13} />
    </div>
    <div className="mb-1 text-[28px] font-semibold tracking-tight text-neutral-900">{value}</div>
    <span className="text-[12px] text-neutral-400">{sub}</span>
  </div>
);
