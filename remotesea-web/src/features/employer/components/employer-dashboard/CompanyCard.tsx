import { ShieldCheck } from "lucide-react";

interface CompanyCardProps {
  company: { companyName: string; isVerified: boolean; hqCountry: string | null };
}

export const CompanyCard = ({ company }: CompanyCardProps) => (
  <div className="rounded-20 border border-neutral-100 bg-white p-5">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-12 bg-gradient-to-br from-brand-400 to-brand-700 text-[18px] font-bold text-white">
        {company.companyName.charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="text-[15px] font-semibold text-neutral-900">{company.companyName}</p>
        <div className="flex items-center gap-1.5 text-[12px] text-neutral-500">
          {company.isVerified && (
            <span className="inline-flex items-center gap-0.5 text-brand-700">
              <ShieldCheck size={11} /> Verified
            </span>
          )}
          {company.hqCountry && <span>· {company.hqCountry}</span>}
        </div>
      </div>
    </div>
  </div>
);
