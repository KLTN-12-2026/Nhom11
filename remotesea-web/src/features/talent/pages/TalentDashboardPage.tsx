import { TalentDashboard } from "@/features/talent/components/TalentDashboard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function TalentDashboardPage() {
  useDocumentTitle("Dashboard");
  return <TalentDashboard />;
}
