import { TalentDashboard } from "@/features/talent/components/TalentDashboard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export const TalentDashboardPage = () => {
  useDocumentTitle("Dashboard");
  return <TalentDashboard />;
};
