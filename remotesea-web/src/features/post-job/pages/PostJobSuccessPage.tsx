import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/constants/routes";

// Stripe redirects here after checkout. Verifying the session's payment status
// would require the Stripe secret key, which must never run in the browser, and
// the backend has no endpoint to check a session by id — the webhook is the real
// source of truth for marking the job paid, so this is a generic confirmation.
export function PostJobSuccessPage() {
  useDocumentTitle("Payment received");

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <CheckCircle2 className="h-14 w-14 text-brand-600" />
      <h1 className="mt-6 text-2xl font-semibold text-neutral-900">Thanks for your submission</h1>
      <p className="mt-3 text-neutral-600">
        Your job is under review. We&apos;ll email you within 24 hours once it&apos;s live.
      </p>
      <Link className="mt-8" to={ROUTES.employerDashboard}>
        <Button size="lg" variant="primary">
          Go to dashboard
        </Button>
      </Link>
    </div>
  );
}
