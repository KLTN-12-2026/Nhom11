import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/features/auth/auth.schemas";
import { resetPassword } from "@/features/auth/auth.api";
import { TextField } from "@/components/shared/TextField";
import { useToast } from "@/components/ui/toast";
import { applyFormSubmitError } from "@/utils/form-errors";
import { ROUTES } from "@/constants/routes";

const MISSING_TOKEN_MESSAGE = "This reset link is missing its token. Request a new one.";

export const ResetPasswordForm = () => {
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

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      setFormError(MISSING_TOKEN_MESSAGE);
      return;
    }
    setFormError(null);
    try {
      await resetPassword({ token, password: values.password });
      toast({
        title: "Password updated",
        description: "Sign in with your new password.",
        variant: "success",
      });
      navigate(ROUTES.login, { replace: true });
    } catch (err) {
      setFormError(applyFormSubmitError(err, setError, "Something went wrong. Please try again."));
    }
  };

  if (!token) {
    return (
      <div className="rounded-12 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        This reset link is invalid or missing its token. Please request a new one.
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <TextField
        error={errors.password?.message}
        id="password"
        label="New password"
        placeholder="At least 8 characters"
        registration={register("password")}
        type="password"
      />

      <TextField
        error={errors.confirmPassword?.message}
        id="confirmPassword"
        label="Confirm new password"
        placeholder="Repeat your password"
        registration={register("confirmPassword")}
        type="password"
      />

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
};
