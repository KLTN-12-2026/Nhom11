import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/features/auth/auth.schemas";
import { resetPassword } from "@/features/auth/auth.api";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/services/api-error";
import { applyServerErrors } from "@/utils/form-errors";
import { ROUTES } from "@/constants/routes";

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    if (!token) {
      setFormError("This reset link is missing its token. Request a new one.");
      return;
    }
    setFormError(null);
    try {
      await resetPassword({ token, password: values.password });
      toast({ title: "Password updated", description: "Sign in with your new password.", variant: "success" });
      navigate(ROUTES.login, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        applyServerErrors(err, setError);
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  if (!token) {
    return (
      <div className="rounded-12 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        This reset link is invalid or missing its token. Please request a new one.
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="password">
          New password
        </label>
        <input
          className="h-11 w-full rounded-12 border border-neutral-200 bg-white px-4 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-brand-600 focus:shadow-focus"
          id="password"
          placeholder="At least 8 characters"
          type="password"
          {...register("password")}
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="confirmPassword">
          Confirm new password
        </label>
        <input
          className="h-11 w-full rounded-12 border border-neutral-200 bg-white px-4 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-brand-600 focus:shadow-focus"
          id="confirmPassword"
          placeholder="Repeat your password"
          type="password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <button
        className="h-11 w-full rounded-12 bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
