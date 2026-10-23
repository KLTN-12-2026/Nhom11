import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/features/auth/auth.schemas";
import { forgotPassword } from "@/features/auth/auth.api";
import { TextField } from "@/components/shared/TextField";
import { applyFormSubmitError } from "@/utils/form-errors";

export const ForgotPasswordForm = () => {
  const [isSent, setIsSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setFormError(null);
    try {
      await forgotPassword(values.email);
      setIsSent(true);
    } catch (err) {
      setFormError(applyFormSubmitError(err, setError, "Something went wrong. Please try again."));
    }
  };

  if (isSent) {
    return (
      <div className="rounded-12 border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
        If that email exists, we&apos;ve sent a reset link. Check your inbox.
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <TextField
        error={errors.email?.message}
        id="email"
        label="Email"
        placeholder="you@example.com"
        registration={register("email")}
        type="email"
      />

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <button
        className="h-11 w-full rounded-12 bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
};
