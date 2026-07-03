import { AlertsManager } from "@/features/alerts/components/AlertsManager";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function AlertsPage() {
  useDocumentTitle("Job Alerts");
  return <AlertsManager />;
}
