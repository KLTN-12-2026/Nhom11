import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useDeleteMyAccount } from "@/features/users/users.queries";

export function DeleteAccountButton() {
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const deleteAccount = useDeleteMyAccount();

  async function handleDelete() {
    try {
      await deleteAccount.mutateAsync();
    } catch {
      toast({ variant: "error", title: "Couldn't delete account", description: "Please try again." });
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        className="rounded-10 border border-red-200 bg-white px-4 py-2 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
        type="button"
        onClick={() => setConfirming(true)}
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
        disabled={deleteAccount.isPending}
        type="button"
        onClick={handleDelete}
      >
        {deleteAccount.isPending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        className="rounded-10 border border-neutral-200 px-4 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50"
        type="button"
        onClick={() => setConfirming(false)}
      >
        Cancel
      </button>
    </div>
  );
}
