interface KpiCardProps {
  label: string;
  icon: React.ElementType;
  value: string;
  sub: string;
}

export const KpiCard = ({ label, icon: Icon, value, sub }: KpiCardProps) => (
  <div className="rounded-20 border border-neutral-100 bg-white p-5">
    <div className="mb-4 flex items-center justify-between">
      <p className="text-[12px] font-medium uppercase tracking-wider text-neutral-400">{label}</p>
      <span className="flex h-7 w-7 items-center justify-center rounded-8 bg-neutral-100">
        <Icon className="text-neutral-500" size={14} />
      </span>
    </div>
    <div className="flex items-end gap-2">
      <span className="text-[30px] font-semibold leading-none tracking-tight text-neutral-900">
        {value}
      </span>
    </div>
    <p className="mt-1 text-[12px] text-neutral-400">{sub}</p>
  </div>
);
