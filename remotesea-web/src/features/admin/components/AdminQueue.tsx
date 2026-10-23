import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  Check,
  Clock,
  Inbox,
  Layers,
  RefreshCw,
  X,
  Zap,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { CompanyInitial } from "@/features/admin/components/CompanyInitial";
import { useAdminJobs, useReviewAdminJob } from "@/features/admin/admin.queries";
import {
  autoChecks,
  formatSalary,
  hoursSince,
  JOB_TYPE_LABELS,
  LEVEL_LABELS,
  PLAN_LABELS,
  REVIEW_CHECKLIST,
  URGENT_WAIT_HOURS,
  waitCls,
  waitFmt,
  type AutoState,
} from "@/features/admin/admin.utils";
import type { AdminJob } from "@/types/admin";

const AUTO_ICON: Record<AutoState, React.ReactNode> = {
  pass: <Check size={12} />,
  warn: <AlertTriangle size={12} />,
  fail: <X size={12} />,
};

const AUTO_COLOR: Record<AutoState, string> = {
  pass: "bg-brand-100 text-brand-700",
  warn: "bg-amber-100 text-amber-700",
  fail: "bg-red-100 text-red-700",
};

const HOURS_PER_DAY = 24;
const RESOLUTION_BANNER_DISPLAY_MS = 1200;

type ResolutionKind = "approved" | "changes" | "rejected";

const submittedLabel = (dateString: string): string => {
  const h = hoursSince(dateString);
  if (h < 1) return "Just now";
  if (h < HOURS_PER_DAY) return `${h}h ago`;
  return `${Math.floor(h / HOURS_PER_DAY)}d ago`;
};

const jobRegion = (j: AdminJob): string => j.country ?? (j.isRemote ? "Remote" : "—");

export const AdminQueue = () => {
  const { toast } = useToast();
  const { data, isLoading } = useAdminJobs("PENDING_REVIEW");
  const reviewJobMutation = useReviewAdminJob();

  const [resolved, setResolved] = useState<Record<string, ResolutionKind>>({});
  const [checked, setChecked] = useState<Record<string, Set<number>>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ id: string; kind: ResolutionKind } | null>(null);
  const [selId, setSelId] = useState<string | null>(null);

  const queue = data?.jobs ?? [];
  const active = queue.filter((j) => !resolved[j.id]);
  // While a confirmation banner is showing, keep displaying the job it's for even
  // though `decide()` has already removed it from `active` — otherwise the banner
  // ends up attached to whatever job the selection snaps to next, and effectively
  // never renders. Only fall through to "pick the next pending job" once the
  // banner's timeout clears both `banner` and `selId` together.
  const effectiveSelId =
    banner?.id ?? (selId && active.some((j) => j.id === selId) ? selId : (active[0]?.id ?? null));
  const sel = queue.find((j) => j.id === effectiveSelId);
  const isResolved = sel && resolved[sel.id];
  const selChecked = (effectiveSelId && checked[effectiveSelId]) || new Set<number>();

  const toggleChecklistItem = (i: number) => {
    if (!effectiveSelId) return;
    setChecked((prev) => {
      const cur = new Set(prev[effectiveSelId] ?? []);
      if (cur.has(i)) cur.delete(i);
      else cur.add(i);
      return { ...prev, [effectiveSelId]: cur };
    });
  };

  const decide = async (kind: ResolutionKind) => {
    if (!effectiveSelId) return;
    const decidedId = effectiveSelId;
    const action = kind === "approved" ? "approve" : "reject";
    try {
      await reviewJobMutation.mutateAsync({ id: decidedId, action, note: notes[decidedId] || undefined });
      toast({
        variant: kind === "approved" ? "success" : "info",
        title: kind === "approved" ? "Job approved & published" : "Job sent back to employer",
      });
      setResolved((prev) => ({ ...prev, [decidedId]: kind }));
      setBanner({ id: decidedId, kind });
      setTimeout(() => {
        setBanner(null);
        setSelId(null);
      }, RESOLUTION_BANNER_DISPLAY_MS);
    } catch {
      toast({ variant: "error", title: "Couldn't submit review" });
    }
  };

  if (isLoading) {
    return <p className="text-sm text-neutral-400">Loading queue…</p>;
  }

  if (queue.length === 0) {
    return (
      <div className="flex-1">
        <h1 className="text-[26px] font-semibold text-neutral-900">Review queue</h1>
        <p className="mt-2 text-sm text-neutral-500">Nothing awaiting review. All caught up. ✅</p>
      </div>
    );
  }

  if (!sel) return null;

  const reqCount = REVIEW_CHECKLIST.length;
  const doneCount = selChecked.size;
  const allDone = doneCount === reqCount;
  const overdue = active.filter((j) => hoursSince(j.createdAt) >= URGENT_WAIT_HOURS).length;
  const avgWait = active.length
    ? Math.round(active.reduce((a, j) => a + hoursSince(j.createdAt), 0) / active.length)
    : 0;
  const approvedCount = Object.values(resolved).filter((v) => v === "approved").length;
  const rejectedCount = Object.values(resolved).filter((v) => v !== "approved").length;

  const facts = [
    {
      k: "Salary",
      v: `${formatSalary(sel.salaryMin, sel.salaryMax, sel.currency)}/mo`,
      mono: true,
    },
    { k: "Type", v: JOB_TYPE_LABELS[sel.jobType] },
    { k: "Region", v: sel.country ?? (sel.isRemote ? "Remote" : "—") },
    { k: "Plan", v: PLAN_LABELS[sel.planType] },
  ];
  const auto = autoChecks(sel);
  const selWaitH = hoursSince(sel.createdAt);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Operations
          </p>
          <h1 className="text-[26px] font-semibold text-neutral-900">Review queue</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Every job is human-reviewed before it goes live · {active.length} awaiting
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        {[
          {
            icon: <Inbox size={14} />,
            label: "In queue",
            val: active.length,
            sub: `${overdue} over SLA`,
          },
          {
            icon: <Clock size={14} />,
            label: "Avg. wait",
            val: waitFmt(avgWait),
            sub: "SLA 24h",
            warn: avgWait >= URGENT_WAIT_HOURS,
          },
          {
            icon: <Check size={14} />,
            label: "Approved this session",
            val: approvedCount,
            sub: "+ live now",
          },
          {
            icon: <Ban size={14} />,
            label: "Rejected this session",
            val: rejectedCount,
            sub: "incl. changes requested",
          },
        ].map((s) => (
          <div className="rounded-12 border border-neutral-100 bg-white p-4" key={s.label}>
            <div className="mb-2 flex items-center gap-1.5 text-[12px] text-neutral-400">
              {s.icon}
              {s.label}
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

      <div className="grid gap-4" style={{ gridTemplateColumns: "280px 1fr" }}>
        {/* List pane */}
        <div className="rounded-12 border border-neutral-100 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <span className="text-[13px] font-semibold text-neutral-900">
              Pending{" "}
              <span className="ml-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px]">
                {active.length}
              </span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-neutral-400">
              <Clock size={12} /> Oldest first
            </span>
          </div>
          <div className="divide-y divide-neutral-50">
            {active.map((j) => (
              <button
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${j.id === effectiveSelId ? "bg-brand-50" : ""}`}
                key={j.id}
                onClick={() => setSelId(j.id)}
              >
                <CompanyInitial name={j.employer.companyName} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-neutral-700">
                    {j.employer.companyName}
                  </div>
                  <div className="truncate text-[13px] font-medium text-neutral-900">{j.title}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className={`font-mono text-[11px] ${waitCls(hoursSince(j.createdAt))}`}>
                      {waitFmt(hoursSince(j.createdAt))}
                    </span>
                    {j.planType === "FEATURED" && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        Featured
                      </span>
                    )}
                    {!j.employer.isVerified && (
                      <VerifiedBadge isVerified={false} label="Unverified employer" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail pane */}
        <div className="overflow-hidden rounded-12 border border-neutral-100 bg-white">
          {banner && banner.id === sel.id && (
            <div
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium ${
                banner.kind === "approved"
                  ? "bg-brand-600 text-white"
                  : banner.kind === "changes"
                    ? "bg-amber-500 text-white"
                    : "bg-red-600 text-white"
              }`}
            >
              {banner.kind === "approved" && <Check size={16} />}
              {banner.kind === "changes" && <RefreshCw size={16} />}
              {banner.kind === "rejected" && <Ban size={16} />}
              {banner.kind === "approved" &&
                "Approved — job is now live and the employer has been notified."}
              {banner.kind === "changes" && "Sent back to the employer with your notes."}
              {banner.kind === "rejected" &&
                "Rejected — the employer has been notified with a reason."}
            </div>
          )}

          <div className="border-b border-neutral-100 p-5">
            <div className="flex items-start gap-4">
              <CompanyInitial name={sel.employer.companyName} size={46} />
              <div className="flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-[13px] text-neutral-500">Submitted by</span>
                  <span className="text-[13px] font-semibold text-neutral-900">
                    {sel.employer.companyName}
                  </span>
                  <VerifiedBadge isVerified={sel.employer.isVerified} size="md" />
                </div>
                <h2 className="mb-2 text-[18px] font-semibold text-neutral-900">{sel.title}</h2>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    sel.categories[0]?.category.name ?? "Other",
                    LEVEL_LABELS[sel.level],
                    JOB_TYPE_LABELS[sel.jobType],
                    jobRegion(sel),
                  ].map((t) => (
                    <span
                      className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-[12px] text-neutral-600"
                      key={t}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[17px] font-semibold text-neutral-900">
                  {formatSalary(sel.salaryMin, sel.salaryMax, sel.currency)}/mo
                </div>
                <div className="text-[12px] text-neutral-400">{submittedLabel(sel.createdAt)}</div>
                <span className={`mt-1 inline-block font-mono text-[12px] ${waitCls(selWaitH)}`}>
                  waited {waitFmt(selWaitH)}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto p-5" style={{ maxHeight: "calc(100vh - 440px)" }}>
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                <Layers size={12} /> Submission summary
              </div>
              <div className="grid grid-cols-2 gap-2">
                {facts.map((f) => (
                  <div
                    className="flex items-center justify-between rounded-8 bg-neutral-50 px-3 py-2 text-[13px]"
                    key={f.k}
                  >
                    <span className="text-neutral-500">{f.k}</span>
                    <span className={`font-medium text-neutral-900 ${f.mono ? "font-mono" : ""}`}>
                      {f.v}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                  <Zap size={12} /> Automated checks
                </span>
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                  {auto.filter((a) => a.state === "pass").length}/{auto.length} clean
                </span>
              </div>
              <div className="space-y-1.5">
                {auto.map((a) => (
                  <div className="flex items-start gap-2.5" key={a.t}>
                    <span
                      className={`mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full ${AUTO_COLOR[a.state]}`}
                    >
                      {AUTO_ICON[a.state]}
                    </span>
                    <div>
                      <div className="text-[13px] font-medium text-neutral-800">{a.t}</div>
                      <div className="text-[12px] text-neutral-400">{a.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                  <Check size={12} /> Reviewer checklist
                </span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
                  {doneCount}/{reqCount}
                </span>
              </div>
              <div className="space-y-2">
                {REVIEW_CHECKLIST.map((c, i) => {
                  const done = selChecked.has(i);
                  return (
                    <div
                      className={`rounded-10 flex cursor-pointer items-start gap-3 border p-3 transition-all ${done ? "border-brand-200 bg-brand-50" : "border-neutral-100 bg-white hover:border-neutral-200"}`}
                      key={c.label}
                      onClick={() => !isResolved && toggleChecklistItem(i)}
                    >
                      <span
                        className={`mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border-2 ${done ? "border-brand-600 bg-brand-600 text-white" : "border-neutral-200 text-transparent"}`}
                      >
                        <Check size={11} />
                      </span>
                      <div className="flex-1">
                        <div
                          className={`text-[13px] font-medium ${done ? "text-brand-700" : "text-neutral-800"}`}
                        >
                          {c.label}
                        </div>
                        <div className="mt-0.5 text-[12px] text-neutral-400">{c.hint}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all"
                    style={{ width: `${reqCount ? (doneCount / reqCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[12px] text-neutral-400">
                  {allDone ? "All checks complete" : `${reqCount - doneCount} left before approval`}
                </span>
              </div>
            </div>

            <div className="space-y-3 border-t border-neutral-100 pt-4">
              <textarea
                aria-label="Note for the employer"
                className="rounded-10 h-20 w-full resize-none border border-neutral-200 bg-white p-3 text-sm outline-none placeholder:text-neutral-400 focus:border-brand-600 disabled:bg-neutral-50 disabled:text-neutral-400"
                disabled={!!isResolved}
                placeholder="Add a note for the employer (sent with change requests & rejections)…"
                value={notes[sel.id] ?? ""}
                onChange={(e) => setNotes((prev) => ({ ...prev, [sel.id]: e.target.value }))}
              />
              {isResolved ? (
                <button className="rounded-10 inline-flex h-9 items-center gap-1.5 border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-500">
                  <Check size={14} />
                  {resolved[sel.id] === "approved"
                    ? "Approved & published"
                    : resolved[sel.id] === "changes"
                      ? "Changes requested"
                      : "Rejected"}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    className={`rounded-10 inline-flex h-9 items-center gap-1.5 px-4 text-sm font-medium transition-colors ${allDone ? "bg-brand-600 text-white hover:bg-brand-700" : "cursor-not-allowed bg-neutral-100 text-neutral-400"}`}
                    disabled={!allDone || reviewJobMutation.isPending}
                    onClick={() => allDone && decide("approved")}
                  >
                    <Check size={14} /> Approve &amp; publish
                  </button>
                  <button
                    className="rounded-10 inline-flex h-9 items-center gap-1.5 border border-amber-200 bg-amber-50 px-4 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-60"
                    disabled={reviewJobMutation.isPending}
                    onClick={() => decide("changes")}
                  >
                    <RefreshCw size={14} /> Request changes
                  </button>
                  <button
                    className="rounded-10 inline-flex h-9 items-center gap-1.5 border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                    disabled={reviewJobMutation.isPending}
                    onClick={() => decide("rejected")}
                  >
                    <Ban size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
