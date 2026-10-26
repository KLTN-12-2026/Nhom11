import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useAdminJobs, useReviewAdminJob } from "@/features/admin/admin.queries";
import { hoursSince, REVIEW_CHECKLIST, URGENT_WAIT_HOURS } from "@/features/admin/admin.utils";
import { QueueKpis } from "@/features/admin/components/admin-queue/QueueKpis";
import { QueueListPane } from "@/features/admin/components/admin-queue/QueueListPane";
import { ResolutionBanner, type ResolutionKind } from "@/features/admin/components/admin-queue/ResolutionBanner";
import { JobSummaryHeader } from "@/features/admin/components/admin-queue/JobSummaryHeader";
import { SubmissionSummary } from "@/features/admin/components/admin-queue/SubmissionSummary";
import { AutomatedChecks } from "@/features/admin/components/admin-queue/AutomatedChecks";
import { ReviewerChecklist } from "@/features/admin/components/admin-queue/ReviewerChecklist";
import { DecisionBar } from "@/features/admin/components/admin-queue/DecisionBar";

const RESOLUTION_BANNER_DISPLAY_MS = 1200;

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

      <QueueKpis
        activeCount={active.length}
        approvedCount={approvedCount}
        avgWaitHours={avgWait}
        overdueCount={overdue}
        rejectedCount={rejectedCount}
      />

      <div className="grid gap-4" style={{ gridTemplateColumns: "280px 1fr" }}>
        <QueueListPane jobs={active} onSelect={setSelId} selectedId={effectiveSelId} />

        <div className="overflow-hidden rounded-12 border border-neutral-100 bg-white">
          <ResolutionBanner banner={banner} jobId={sel.id} />
          <JobSummaryHeader job={sel} />

          <div className="overflow-y-auto p-5" style={{ maxHeight: "calc(100vh - 440px)" }}>
            <SubmissionSummary job={sel} />
            <AutomatedChecks job={sel} />
            <ReviewerChecklist checkedIndices={selChecked} disabled={!!isResolved} onToggle={toggleChecklistItem} />
            <DecisionBar
              canApprove={allDone}
              isPending={reviewJobMutation.isPending}
              note={notes[sel.id] ?? ""}
              resolution={isResolved}
              onApprove={() => decide("approved")}
              onNoteChange={(value) => setNotes((prev) => ({ ...prev, [sel.id]: value }))}
              onReject={() => decide("rejected")}
              onRequestChanges={() => decide("changes")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
