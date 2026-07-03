import { EmployerDashboard } from "@/features/employer/components/EmployerDashboard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function EmployerDashboardPage() {
  useDocumentTitle("Employer Dashboard");
  return <EmployerDashboard />;
}
