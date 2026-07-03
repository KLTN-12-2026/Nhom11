import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/features/auth/auth.schemas";
import { forgotPassword } from "@/features/auth/auth.api";
import { ApiError } from "@/services/api-error";
import { applyServerErrors } from "@/utils/form-errors";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
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

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFormError(null);
    try {
      await forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        applyServerErrors(err, setError);
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  if (sent) {
    return (
      <div className="rounded-12 border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
        If that email exists, we&apos;ve sent a reset link. Check your inbox.
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="email">
          Email
        </label>
        <input
          className="h-11 w-full rounded-12 border border-neutral-200 bg-white px-4 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-brand-600 focus:shadow-focus"
          id="email"
          placeholder="you@example.com"
          type="email"
          {...register("email")}
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

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
}
