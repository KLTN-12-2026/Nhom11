import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/constants/routes";

export const ResetPasswordPage = () => {
  useDocumentTitle("Reset Password");

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-md flex-col justify-center px-8 py-12">
      <Link
        className="mb-10 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        to={ROUTES.login}
      >
        <ArrowLeft size={14} /> Back to sign in
      </Link>

      <h1 className="mb-1 text-[32px] font-semibold tracking-tight text-neutral-900">
        Choose a new password.
      </h1>
      <p className="mb-8 text-sm text-neutral-500">Make it at least 8 characters.</p>

      <ResetPasswordForm />
    </div>
  );
};
