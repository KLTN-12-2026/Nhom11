import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToastMutation } from "@/hooks/useToastMutation";
import { accountNameFormSchema, type AccountNameFormValues } from "@/features/settings/settings.schemas";
import { useUpdateMyName } from "@/features/users/users.queries";

export const AccountNameForm = () => {
  const { user } = useAuth();
  const runWithToast = useToastMutation();
  const updateNameMutation = useUpdateMyName();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AccountNameFormValues>({
    resolver: zodResolver(accountNameFormSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  const onSubmit = (values: AccountNameFormValues) =>
    runWithToast(() => updateNameMutation.mutateAsync(values.name), {
      success: "Name updated",
      error: "Couldn't update name",
      errorDescription: "Please try again.",
    });

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1.5">
        <label className="block text-[12.5px] font-medium text-neutral-700">Full name</label>
        <div className="flex items-center gap-2">
          <input
            className="w-full rounded-10 border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            {...register("name")}
          />
          {isDirty && (
            <button
              className="flex-shrink-0 rounded-10 bg-brand-600 px-3 py-2.5 text-[12.5px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              Save
            </button>
          )}
        </div>
        {errors.name && <p className="text-[11.5px] text-red-600">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="block text-[12.5px] font-medium text-neutral-700">
          Email <span className="font-normal text-neutral-400">Used to sign in</span>
        </label>
        <input
          className="w-full cursor-default rounded-10 border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-[13.5px] text-neutral-900"
          readOnly
          value={user?.email ?? ""}
        />
      </div>
    </form>
  );
};
