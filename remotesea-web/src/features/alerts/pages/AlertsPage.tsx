import { AlertsManager } from "@/features/alerts/components/AlertsManager";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export const AlertsPage = () => {
  useDocumentTitle("Job Alerts");
  return <AlertsManager />;
};
