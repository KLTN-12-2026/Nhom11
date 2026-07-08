import { memo, useCallback, useState } from "react";
import { Briefcase, Building, Search, Shield, Wallet } from "lucide-react";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { EmptyRow } from "@/components/shared/EmptyRow";
import { PillToggle } from "@/components/shared/PillToggle";
import { CompanyLogo } from "@/components/ui/company-logo";
import { useToastMutation } from "@/hooks/useToastMutation";
import { AdminEmployersSkeleton } from "@/features/admin/components/AdminEmployersSkeleton";
import { useAdminEmployers, useUpdateAdminEmployer } from "@/features/admin/admin.queries";
import { colorFor } from "@/features/admin/admin.utils";
import type { AdminEmployer } from "@/types/admin";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unverified", label: "Unverified" },
] as const;

const CENTS_PER_DOLLAR = 100;
const DOLLARS_PER_THOUSAND = 1000;

interface EmployerRowProps {
  employer: AdminEmployer;
  maxSpend: number;
  isPending: boolean;
  onStatusChange: (id: string, action: "verify" | "suspend") => void;
}

const EmployerRow = memo(function EmployerRow({
  employer: e,
  maxSpend,
  isPending,
  onStatusChange,
}: EmployerRowProps) {
  return (
    <div
      className="grid items-center border-b border-neutral-50 px-5 py-4 transition-colors last:border-0 hover:bg-neutral-50"
      style={{ gridTemplateColumns: "1fr 90px 140px 100px 32px" }}
    >
      <div className="flex items-center gap-3">
        <CompanyLogo
          color={colorFor(e.companyName)}
          initial={e.companyName.charAt(0).toUpperCase()}
          size={38}
        />
        <div>
          <div className="flex items-center gap-1.5 text-[14px] font-semibold text-neutral-900">
            {e.companyName}
            <VerifiedBadge isVerified={e.isVerified} />
          </div>
          <div className="text-[12px] text-neutral-400">
            {e.user.email} · {e.hqCountry ?? "—"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 text-[14px] font-semibold text-neutral-900">
        <Briefcase className="text-neutral-300" size={12} /> {e.jobCount}
      </div>
      <div>
        <div className="mb-1 font-mono text-[13px] font-semibold text-neutral-900">
          ${(e.totalSpend / CENTS_PER_DOLLAR).toLocaleString()}
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-brand-600"
            style={{ width: `${Math.round((e.totalSpend / maxSpend) * 100)}%` }}
          />
        </div>
      </div>
      <span className="text-[13px] text-neutral-400">
        {new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
      </span>
      {e.isVerified ? (
        <button
          className="rounded-6 border border-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          disabled={isPending}
          type="button"
          onClick={() => onStatusChange(e.id, "suspend")}
        >
          Suspend
        </button>
      ) : (
        <button
          className="rounded-6 border border-brand-200 bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-60"
          disabled={isPending}
          type="button"
          onClick={() => onStatusChange(e.id, "verify")}
        >
          Verify
        </button>
      )}
    </div>
  );
});

export const AdminEmployers = () => {
  const runWithToast = useToastMutation();
  const { data, isLoading } = useAdminEmployers();
  const updateEmployerMutation = useUpdateAdminEmployer();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [search, setSearch] = useState("");

  const employers = data?.employers ?? [];

  const { mutateAsync: updateEmployer } = updateEmployerMutation;
  const updateEmployerStatus = useCallback(
    (id: string, action: "verify" | "suspend") =>
      runWithToast(() => updateEmployer({ id, action }), {
        success: action === "verify" ? "Employer verified" : "Employer suspended",
        successVariant: action === "verify" ? "success" : "info",
        error: "Couldn't update employer",
      }),
    [updateEmployer, runWithToast]
  );

  const rows = employers.filter((e) => {
    if (filter === "unverified" && e.isVerified) return false;
    if (search && !e.companyName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: employers.length,
    unverified: employers.filter((e) => !e.isVerified).length,
  };
  const totalSpendCents = employers.reduce((a, e) => a + e.totalSpend, 0);
  const totalListings = employers.reduce((a, e) => a + e.jobCount, 0);
  const maxSpend = Math.max(1, ...employers.map((e) => e.totalSpend));

  if (isLoading) return <AdminEmployersSkeleton />;

  return (
    <div className="flex-1 overflow-hidden">
      <div className="mb-6">
        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          Operations
        </p>
        <h1 className="text-[26px] font-semibold text-neutral-900">Employers</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {employers.length} companies · {totalListings} total listings · $
          {(totalSpendCents / CENTS_PER_DOLLAR).toLocaleString()} billed
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          {
            icon: <Building size={14} />,
            label: "Total employers",
            val: employers.length,
            sub: "all time",
          },
          {
            icon: <Shield size={14} />,
            label: "Unverified",
            val: counts.unverified,
            sub: "need review",
            warn: counts.unverified > 0,
          },
          {
            icon: <Wallet size={14} />,
            label: "Total billed",
            val: `$${(totalSpendCents / CENTS_PER_DOLLAR / DOLLARS_PER_THOUSAND).toFixed(1)}k`,
            sub: "lifetime",
          },
        ].map((s) => (
          <div className="rounded-12 border border-neutral-100 bg-white p-4" key={s.label}>
            <div className="mb-2 flex items-center gap-1.5 text-[12px] text-neutral-400">
              {s.icon} {s.label}
            </div>
            <div
              className={`text-[22px] font-semibold ${s.warn ? "text-amber-600" : "text-neutral-900"}`}
            >
              {s.val}
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-400">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter + search */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <PillToggle
              active={filter === f.id}
              activeClassName="bg-brand-600 text-white"
              className="px-3.5 py-1.5 text-[13px] font-medium transition-colors"
              inactiveClassName="border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
              key={f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}{" "}
              <span
                className={`ml-1 text-[11px] ${filter === f.id ? "text-white/70" : "text-neutral-400"}`}
              >
                {counts[f.id]}
              </span>
            </PillToggle>
          ))}
        </div>
        <div className="rounded-10 ml-auto flex h-9 items-center gap-2 border border-neutral-200 bg-white px-3 focus-within:border-brand-600 focus-within:shadow-focus">
          <Search className="text-neutral-400" size={14} />
          <input
            aria-label="Search employers"
            className="w-48 bg-transparent text-sm outline-none placeholder:text-neutral-400"
            placeholder="Search employers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-12 border border-neutral-100 bg-white">
        <div
          className="grid border-b border-neutral-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400"
          style={{ gridTemplateColumns: "1fr 90px 140px 100px 32px" }}
        >
          <span>Employer</span>
          <span>Listings</span>
          <span>Total spend</span>
          <span>Joined</span>
          <span />
        </div>
        {rows.length === 0 ? (
          <EmptyRow>No employers match this filter.</EmptyRow>
        ) : (
          rows.map((e) => (
            <EmployerRow
              employer={e}
              isPending={updateEmployerMutation.isPending}
              key={e.id}
              maxSpend={maxSpend}
              onStatusChange={updateEmployerStatus}
            />
          ))
        )}
      </div>
    </div>
  );
};
