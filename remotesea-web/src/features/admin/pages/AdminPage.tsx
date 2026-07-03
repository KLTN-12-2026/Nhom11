import { AdminConsole } from "@/features/admin/components/AdminConsole";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function AdminPage() {
  useDocumentTitle("Ops Console");
  return <AdminConsole />;
}
