import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { loginSchema, type LoginFormValues } from "@/features/auth/auth.schemas";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/services/api-error";
import { applyServerErrors } from "@/utils/form-errors";
import { ROUTES } from "@/constants/routes";

export function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? ROUTES.jobs;
  const { login } = useAuth();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login(values.email, values.password, values.remember);
      navigate(callbackUrl, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        applyServerErrors(err, setError);
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      toast({ title: "Sign in failed", variant: "error" });
    }
  }

  return (
    <>
      <OAuthButtons />

      <div className="mb-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">
          or with email
        </span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

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

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-neutral-700" htmlFor="password">
              Password
            </label>
            <Link className="text-xs text-brand-600 hover:text-brand-700" to={ROUTES.forgotPassword}>
              Forgot?
            </Link>
          </div>
          <input
            className="h-11 w-full rounded-12 border border-neutral-200 bg-white px-4 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-brand-600 focus:shadow-focus"
            id="password"
            placeholder="••••••••"
            type="password"
            {...register("password")}
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input
            className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-600"
            type="checkbox"
            {...register("remember")}
          />
          Remember me
        </label>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          className="h-11 w-full rounded-12 bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </>
  );
}
