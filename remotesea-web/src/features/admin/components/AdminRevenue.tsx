import { CreditCard, RefreshCw, TrendingUp, Wallet } from "lucide-react";
import { useAdminRevenue } from "@/features/admin/admin.queries";
import type { RevenueMonthBucket } from "@/types/admin";

const CENTS_PER_DOLLAR = 100;
const DOLLARS_PER_THOUSAND = 1000;

const PLAN_BAR_COLOR: Record<string, string> = {
  STANDARD: "#4ade80",
  FEATURED: "#2E9B52",
  HANDS_ON: "#0D3D1F",
};

const formatDollars = (cents: number): string => `$${(cents / CENTS_PER_DOLLAR).toLocaleString()}`;

const formatThousands = (cents: number): string => `$${(cents / CENTS_PER_DOLLAR / DOLLARS_PER_THOUSAND).toFixed(1)}k`;

const monthTotal = (month: RevenueMonthBucket): number => month.standard + month.featured + month.handsOn;

export const AdminRevenue = () => {
  const { data, isLoading } = useAdminRevenue();

  if (isLoading) return <p className="text-sm text-neutral-400">Loading revenue…</p>;
  if (!data) return null;

  const { months, mix, transactions, totals } = data;
  const peak = Math.max(...months.map(monthTotal), 1);
  const totalMix = Math.max(mix.reduce((sum, m) => sum + m.amount, 0), 1);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Finance</p>
          <h1 className="text-[26px] font-semibold text-neutral-900">Revenue</h1>
          <p className="mt-1 text-sm text-neutral-500">Per-post billing · all amounts in USD</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-12 border border-neutral-100 bg-white p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[12px] text-neutral-400">
            <Wallet size={14} /> Revenue all time
          </div>
          <div className="text-[22px] font-semibold text-neutral-900">{formatThousands(totals.allTime)}</div>
          <div className="mt-0.5 text-[11px] text-neutral-400">across every paid listing</div>
        </div>
        <div className="rounded-12 border border-neutral-100 bg-white p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[12px] text-neutral-400">
            <TrendingUp size={14} /> This month
          </div>
          <div className="text-[22px] font-semibold text-neutral-900">{formatDollars(totals.thisMonth)}</div>
          <div className="mt-0.5 text-[11px] text-neutral-400">in progress</div>
        </div>
        {mix.map((m) => (
          <div className="rounded-12 border border-neutral-100 bg-white p-4" key={m.planType}>
            <div className="mb-2 flex items-center gap-1.5 text-[12px] text-neutral-400">
              <RefreshCw size={14} /> {m.label}
            </div>
            <div className="text-[22px] font-semibold text-neutral-900">{m.count}</div>
            <div className="mt-0.5 text-[11px] text-neutral-400">posts · {formatDollars(m.amount)}</div>
          </div>
        ))}
      </div>

      {/* Chart + mix */}
      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-12 border border-neutral-100 bg-white p-5">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="text-[22px] font-semibold text-neutral-900">{formatThousands(totals.allTime)}</div>
              <div className="text-[12px] text-neutral-400">Monthly revenue · last {months.length} months</div>
            </div>
            <div className="flex items-center gap-4 text-[12px] text-neutral-500">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PLAN_BAR_COLOR.STANDARD }} /> Standard
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PLAN_BAR_COLOR.FEATURED }} /> Featured
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PLAN_BAR_COLOR.HANDS_ON }} /> Hands-on
              </span>
            </div>
          </div>
          <div className="flex h-40 items-end gap-1.5">
            {months.map((month) => {
              const sum = monthTotal(month);
              return (
                <div className="flex flex-1 flex-col items-center gap-1" key={month.key}>
                  <div
                    className="flex w-full flex-col-reverse overflow-hidden rounded-t-4"
                    style={{ height: `${(sum / peak) * 140}px` }}
                    title={`${month.label}: ${formatDollars(sum)}`}
                  >
                    {sum > 0 && (
                      <>
                        <div style={{ height: `${(month.standard / sum) * 100}%`, background: PLAN_BAR_COLOR.STANDARD }} />
                        <div style={{ height: `${(month.featured / sum) * 100}%`, background: PLAN_BAR_COLOR.FEATURED }} />
                        <div style={{ height: `${(month.handsOn / sum) * 100}%`, background: PLAN_BAR_COLOR.HANDS_ON }} />
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400">{month.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-12 border border-neutral-100 bg-white p-5">
          <h3 className="mb-4 text-[14px] font-semibold text-neutral-900">
            Revenue by plan <span className="text-[12px] font-normal text-neutral-400">· all time</span>
          </h3>
          <div className="mb-4 flex h-6 overflow-hidden rounded-8">
            {mix.map((m) => (
              <div
                className="flex items-center justify-center text-[10px] font-semibold text-white"
                key={m.planType}
                style={{ width: `${(m.amount / totalMix) * 100}%`, background: PLAN_BAR_COLOR[m.planType] }}
              >
                {m.amount > 0 ? `${Math.round((m.amount / totalMix) * 100)}%` : ""}
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {mix.map((m) => (
              <div className="flex items-center gap-2.5" key={m.planType}>
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: PLAN_BAR_COLOR[m.planType] }} />
                <span className="flex-1 text-[13px] text-neutral-700">
                  {m.label} <span className="font-mono text-[11px] text-neutral-400">{formatDollars(m.price)}</span>
                </span>
                <span className="text-[12px] text-neutral-400">{m.count} posts</span>
                <span className="font-mono text-[13px] font-semibold text-neutral-900">{formatThousands(m.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="overflow-hidden rounded-12 border border-neutral-100 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <h3 className="text-[14px] font-semibold text-neutral-900">Recent transactions</h3>
        </div>
        <div
          className="grid border-b border-neutral-50 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400"
          style={{ gridTemplateColumns: "1fr 140px 100px 90px" }}
        >
          <span>Employer</span>
          <span>Plan</span>
          <span>Amount</span>
          <span>Date</span>
        </div>
        {transactions.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-neutral-400">No paid listings yet.</p>
        ) : (
          transactions.map((t) => (
            <div
              className="grid items-center border-b border-neutral-50 px-5 py-3.5 last:border-0"
              key={t.jobId}
              style={{ gridTemplateColumns: "1fr 140px 100px 90px" }}
            >
              <div className="min-w-0">
                <div className="truncate text-[14px] font-medium text-neutral-900">{t.companyName}</div>
                <div className="truncate text-[12px] text-neutral-400">{t.jobTitle}</div>
              </div>
              <span className="flex items-center gap-1 text-[13px] text-neutral-600">
                <CreditCard size={13} /> {t.planType === "HANDS_ON" ? "Hands-on" : t.planType === "FEATURED" ? "Featured" : "Standard"}
              </span>
              <span className="font-mono text-[13px] font-semibold text-neutral-900">{formatDollars(t.amount)}</span>
              <span className="text-[13px] text-neutral-400">
                {new Date(t.paidAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
