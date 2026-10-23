import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { loginSchema, type LoginFormValues } from "@/features/auth/auth.schemas";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";
import { OrDivider } from "@/features/auth/components/OrDivider";
import { TextField } from "@/components/shared/TextField";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { applyFormSubmitError } from "@/utils/form-errors";
import { ROUTES } from "@/constants/routes";

export const LoginForm = () => {
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

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      await login(values.email, values.password, values.remember);
      navigate(callbackUrl, { replace: true });
    } catch (err) {
      setFormError(applyFormSubmitError(err, setError, "Something went wrong. Please try again."));
      toast({ title: "Sign in failed", variant: "error" });
    }
  };

  return (
    <>
      <OAuthButtons />
      <OrDivider label="or with email" />

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          error={errors.email?.message}
          id="email"
          label="Email"
          placeholder="you@example.com"
          registration={register("email")}
          type="email"
        />

        <TextField
          error={errors.password?.message}
          id="password"
          label="Password"
          labelSlot={
            <Link className="text-xs text-brand-600 hover:text-brand-700" to={ROUTES.forgotPassword}>
              Forgot?
            </Link>
          }
          placeholder="••••••••"
          registration={register("password")}
          type="password"
        />

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
};
