import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { registerSchema, type RegisterFormValues } from "@/features/auth/auth.schemas";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/services/api-error";
import { applyServerErrors } from "@/utils/form-errors";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";

const ROLES = [
  { value: "TALENT", label: "I'm looking for work" },
  { value: "EMPLOYER", label: "I'm hiring" },
] as const;

export function RegisterForm() {
  const navigate = useNavigate();
  const { registerAccount } = useAuth();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: "TALENT" },
  });

  const role = watch("role");

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    try {
      const user = await registerAccount(values);
      navigate(user.role === "EMPLOYER" ? ROUTES.employerDashboard : "/profile", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        applyServerErrors(err, setError);
        setFormError(
          err.status === 409 ? "That email is already registered." : err.message
        );
      } else {
        setFormError("Please check your details and try again.");
      }
      toast({ title: "Registration failed", variant: "error" });
    }
  }

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-2">
        {ROLES.map((r) => (
          <button
            className={cn(
              "h-10 rounded-12 border text-sm font-medium transition-all",
              role === r.value
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
            )}
            key={r.value}
            type="button"
            onClick={() => setValue("role", r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>

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
          <label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="name">
            Full name
          </label>
          <input
            className="h-11 w-full rounded-12 border border-neutral-200 bg-white px-4 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-brand-600 focus:shadow-focus"
            id="name"
            placeholder="Phạm Tuấn"
            type="text"
            {...register("name")}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

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
          <label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="password">
            Password
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

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          className="h-11 w-full rounded-12 bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center text-[12px] text-neutral-400">
          By signing up you agree to our{" "}
          <Link className="text-neutral-600 hover:underline" to="/terms">
            Terms
          </Link>{" "}
          and{" "}
          <Link className="text-neutral-600 hover:underline" to="/privacy">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </>
  );
}
