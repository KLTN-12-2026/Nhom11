import { useState } from "react";
import { useToastMutation } from "@/hooks/useToastMutation";
import { useDeleteMyAccount } from "@/features/users/users.queries";

export const DeleteAccountButton = () => {
  const runWithToast = useToastMutation();
  const [isConfirming, setIsConfirming] = useState(false);
  const deleteAccountMutation = useDeleteMyAccount();

  const handleDelete = async () => {
    await runWithToast(() => deleteAccountMutation.mutateAsync(), {
      error: "Couldn't delete account",
      errorDescription: "Please try again.",
    });
    setIsConfirming(false);
  };

  if (!isConfirming) {
    return (
      <button
        className="rounded-10 border border-red-200 bg-white px-4 py-2 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
        type="button"
        onClick={() => setIsConfirming(true)}
      >
        Delete account
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[13px] text-neutral-600">Are you sure? This cannot be undone.</span>
      <button
        className="rounded-10 bg-red-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
        disabled={deleteAccountMutation.isPending}
        type="button"
        onClick={handleDelete}
      >
        {deleteAccountMutation.isPending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        className="rounded-10 border border-neutral-200 px-4 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50"
        type="button"
        onClick={() => setIsConfirming(false)}
      >
        Cancel
      </button>
    </div>
  );
};
