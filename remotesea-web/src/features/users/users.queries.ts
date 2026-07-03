import { useMutation } from "@tanstack/react-query";
import { changeMyPassword, deleteMyAccount, updateMyName } from "@/features/users/users.api";
import { useAuth } from "@/contexts/AuthContext";

export function useUpdateMyName() {
  const { patchUser } = useAuth();
  return useMutation({
    mutationFn: updateMyName,
    onSuccess: (result) => {
      patchUser({ name: result.name });
    },
  });
}

export function useChangeMyPassword() {
  return useMutation({ mutationFn: changeMyPassword });
}

export function useDeleteMyAccount() {
  const { logout } = useAuth();
  return useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: () => {
      logout();
    },
  });
}
