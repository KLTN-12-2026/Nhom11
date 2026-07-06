import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { registerSchema, type RegisterFormValues } from "@/features/auth/auth.schemas";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";
import { OrDivider } from "@/features/auth/components/OrDivider";
import { TextField } from "@/components/shared/TextField";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/services/api-error";
import { applyFormSubmitError } from "@/utils/form-errors";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";

const ROLE_OPTIONS = [
  { value: "TALENT", label: "I'm looking for work" },
  { value: "EMPLOYER", label: "I'm hiring" },
] as const;

const DUPLICATE_EMAIL_STATUS = 409;

const resolveRegisterErrorMessage = (error: ApiError): string =>
  error.status === DUPLICATE_EMAIL_STATUS ? "That email is already registered." : error.message;

export const RegisterForm = () => {
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

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);
    try {
      const user = await registerAccount(values);
      navigate(user.role === "EMPLOYER" ? ROUTES.employerDashboard : "/profile", { replace: true });
    } catch (err) {
      setFormError(
        applyFormSubmitError(
          err,
          setError,
          "Please check your details and try again.",
          resolveRegisterErrorMessage
        )
      );
      toast({ title: "Registration failed", variant: "error" });
    }
  };

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-2">
        {ROLE_OPTIONS.map((option) => (
          <button
            className={cn(
              "h-10 rounded-12 border text-sm font-medium transition-all",
              role === option.value
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
            )}
            key={option.value}
            type="button"
            onClick={() => setValue("role", option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <OAuthButtons />
      <OrDivider label="or with email" />

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          error={errors.name?.message}
          id="name"
          label="Full name"
          placeholder="Phạm Tuấn"
          registration={register("name")}
        />

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
          placeholder="At least 8 characters"
          registration={register("password")}
          type="password"
        />

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
};
