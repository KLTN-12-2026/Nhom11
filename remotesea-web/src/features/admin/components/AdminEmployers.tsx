import { useState } from "react";
import { Briefcase, Building, Flag, Search, Shield, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useAdminEmployers, useUpdateAdminEmployer } from "@/features/admin/admin.queries";
import { colorFor } from "@/features/admin/admin.utils";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unverified", label: "Unverified" },
] as const;

function CompanyInitial({ name, color, size = 38 }: { name: string; color: string; size?: number }) {
  return (
    <div
      aria-label={name}
      className="grid flex-shrink-0 place-items-center rounded-10 font-semibold text-white"
      style={{ background: color, width: size, height: size, fontSize: size * 0.38 }}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}

export function AdminEmployers() {
  const { toast } = useToast();
  const { data, isLoading } = useAdminEmployers();
  const updateEmployer = useUpdateAdminEmployer();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [search, setSearch] = useState("");

  const employers = data?.employers ?? [];

  async function act(id: string, action: "verify" | "suspend") {
    try {
      await updateEmployer.mutateAsync({ id, action });
      toast({
        variant: action === "verify" ? "success" : "info",
        title: action === "verify" ? "Employer verified" : "Employer suspended",
      });
    } catch {
      toast({ variant: "error", title: "Couldn't update employer" });
    }
  }

  const rows = employers.filter((e) => {
    if (filter === "unverified" && e.isVerified) return false;
    if (search && !e.companyName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = { all: employers.length, unverified: employers.filter((e) => !e.isVerified).length };
  const totalSpendCents = employers.reduce((a, e) => a + e.totalSpend, 0);
  const totalListings = employers.reduce((a, e) => a + e.jobCount, 0);
  const maxSpend = Math.max(1, ...employers.map((e) => e.totalSpend));

  if (isLoading) return <p className="text-sm text-neutral-400">Loading employers…</p>;

  return (
    <div className="flex-1 overflow-hidden">
      <div className="mb-6">
        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Operations</p>
        <h1 className="text-[26px] font-semibold text-neutral-900">Employers</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {employers.length} companies · {totalListings} total listings · ${(totalSpendCents / 100).toLocaleString()} billed
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { icon: <Building size={14} />, label: "Total employers", val: employers.length, sub: "all time" },
          { icon: <Shield size={14} />, label: "Unverified", val: counts.unverified, sub: "need review", warn: counts.unverified > 0 },
          { icon: <Wallet size={14} />, label: "Total billed", val: `$${(totalSpendCents / 100 / 1000).toFixed(1)}k`, sub: "lifetime" },
        ].map((s) => (
          <div className="rounded-12 border border-neutral-100 bg-white p-4" key={s.label}>
            <div className="mb-2 flex items-center gap-1.5 text-[12px] text-neutral-400">
              {s.icon} {s.label}
            </div>
            <div className={`text-[22px] font-semibold ${s.warn ? "text-amber-600" : "text-neutral-900"}`}>{s.val}</div>
            <div className="mt-0.5 text-[11px] text-neutral-400">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter + search */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${filter === f.id ? "bg-brand-600 text-white" : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"}`}
              key={f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label} <span className={`ml-1 text-[11px] ${filter === f.id ? "text-white/70" : "text-neutral-400"}`}>{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex h-9 items-center gap-2 rounded-10 border border-neutral-200 bg-white px-3">
          <Search className="text-neutral-400" size={14} />
          <input
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
          <p className="py-8 text-center text-[13px] text-neutral-400">No employers match this filter.</p>
        ) : (
          rows.map((e) => (
            <div
              className="grid items-center border-b border-neutral-50 px-5 py-4 transition-colors last:border-0 hover:bg-neutral-50"
              key={e.id}
              style={{ gridTemplateColumns: "1fr 90px 140px 100px 32px" }}
            >
              <div className="flex items-center gap-3">
                <CompanyInitial color={colorFor(e.companyName)} name={e.companyName} />
                <div>
                  <div className="flex items-center gap-1.5 text-[14px] font-semibold text-neutral-900">
                    {e.companyName}
                    {e.isVerified ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                        <Shield size={9} /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] text-red-600">
                        <Flag size={8} /> Unverified
                      </span>
                    )}
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
                  ${(e.totalSpend / 100).toLocaleString()}
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.round((e.totalSpend / maxSpend) * 100)}%` }} />
                </div>
              </div>
              <span className="text-[13px] text-neutral-400">
                {new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
              {e.isVerified ? (
                <button
                  className="rounded-6 border border-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                  disabled={updateEmployer.isPending}
                  type="button"
                  onClick={() => act(e.id, "suspend")}
                >
                  Suspend
                </button>
              ) : (
                <button
                  className="rounded-6 border border-brand-200 bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-60"
                  disabled={updateEmployer.isPending}
                  type="button"
                  onClick={() => act(e.id, "verify")}
                >
                  Verify
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
