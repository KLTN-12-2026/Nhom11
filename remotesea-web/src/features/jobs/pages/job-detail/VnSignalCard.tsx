interface VnSignalCardProps {
  vnHireCount: number;
  companyName: string;
}

export const VnSignalCard = ({ vnHireCount, companyName }: VnSignalCardProps) => {
  if (vnHireCount === 0) return null;

  return (
    <div className="flex gap-3 rounded-16 border border-neutral-100 bg-white p-5">
      <span className="text-[28px]">🇻🇳</span>
      <div>
        <h5 className="mb-1 text-[13px] font-semibold text-neutral-900">
          {vnHireCount} Vietnamese already work at {companyName}
        </h5>
        <p className="text-[12px] leading-relaxed text-neutral-500">
          You can connect with them through your application — they&apos;re often happy to refer or
          share what the team&apos;s actually like.
        </p>
      </div>
    </div>
  );
};
