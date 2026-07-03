import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/toast";
import { useChangeMyPassword } from "@/features/users/users.queries";
import { ApiError } from "@/services/api-error";
import { applyServerErrors } from "@/utils/form-errors";
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from "@/features/settings/settings.schemas";

const inputCls =
  "w-full rounded-10 border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

export function ChangePasswordForm() {
  const { toast } = useToast();
  const changePassword = useChangeMyPassword();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    try {
      await changePassword.mutateAsync(values);
      toast({ variant: "success", title: "Password updated" });
      reset();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not update password. Please try again.";
      if (err instanceof ApiError) applyServerErrors(err, setError);
      toast({ variant: "error", title: "Couldn't update password", description: message });
    }
  }

  return (
    <form className="mb-5 max-w-sm space-y-2.5" onSubmit={handleSubmit(onSubmit)}>
      <label className="block text-[12.5px] font-medium text-neutral-700">Change password</label>
      <input
        className={inputCls}
        placeholder="Current password"
        type="password"
        {...register("currentPassword")}
      />
      {errors.currentPassword && (
        <p className="text-[12px] text-red-600">{errors.currentPassword.message}</p>
      )}
      <input
        className={inputCls}
        placeholder="New password (min 8 characters)"
        type="password"
        {...register("newPassword")}
      />
      {errors.newPassword && <p className="text-[12px] text-red-600">{errors.newPassword.message}</p>}
      <button
        className="rounded-10 bg-brand-600 px-4 py-2.5 text-[12.5px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
