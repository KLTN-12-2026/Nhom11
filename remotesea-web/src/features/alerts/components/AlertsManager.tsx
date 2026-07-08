import { EmptyRow } from "@/components/shared/EmptyRow";
import { useToastMutation } from "@/hooks/useToastMutation";
import { AlertListItem } from "@/features/alerts/components/AlertListItem";
import { CreateAlertForm } from "@/features/alerts/components/CreateAlertForm";
import {
  useAlerts,
  useCreateAlert,
  useDeleteAlert,
  useSetAlertActive,
} from "@/features/alerts/alerts.queries";
import type { CreateAlertPayload, JobAlert } from "@/types/alert";

export const AlertsManager = () => {
  const runWithToast = useToastMutation();
  const { data: alerts, isLoading } = useAlerts();
  const createAlertMutation = useCreateAlert();
  const setActiveMutation = useSetAlertActive();
  const deleteAlertMutation = useDeleteAlert();

  const handleCreate = (payload: CreateAlertPayload) =>
    runWithToast(() => createAlertMutation.mutateAsync(payload), {
      success: "Alert created",
      successDescription: "We'll email you matching jobs.",
      error: "Couldn't create alert",
    });

  const handleToggleActive = (alert: JobAlert) =>
    runWithToast(() => setActiveMutation.mutateAsync({ id: alert.id, isActive: !alert.isActive }), {
      error: "Couldn't update alert",
    });

  const handleDelete = (alert: JobAlert) =>
    runWithToast(() => deleteAlertMutation.mutateAsync(alert.id), {
      success: "Alert deleted",
      error: "Couldn't delete alert",
    });

  return (
    <div className="mx-auto max-w-[820px] px-6 py-10">
      <div className="mb-8">
        <h1 className="mb-1 text-[28px] font-semibold tracking-tight text-neutral-900">Job alerts</h1>
        <p className="text-[15px] text-neutral-500">
          Get notified when new jobs match your criteria. We email you on your chosen schedule.
        </p>
      </div>

      <CreateAlertForm onCreate={handleCreate} />

      <div className="space-y-3">
        {isLoading ? (
          <EmptyRow>Loading alerts…</EmptyRow>
        ) : !alerts || alerts.length === 0 ? (
          <EmptyRow>No alerts yet. Create one above to start getting matched jobs.</EmptyRow>
        ) : (
          alerts.map((alert) => (
            <AlertListItem
              alert={alert}
              key={alert.id}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))
        )}
      </div>
    </div>
  );
};
