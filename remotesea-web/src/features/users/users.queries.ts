import { useMutation } from "@tanstack/react-query";
import { changeMyPassword, deleteMyAccount, updateMyName } from "@/features/users/users.api";
import { useAuth } from "@/contexts/AuthContext";

export const useUpdateMyName = () => {
  const { patchUser } = useAuth();
  return useMutation({
    mutationFn: updateMyName,
    onSuccess: (result) => {
      patchUser({ name: result.name });
    },
  });
};

export const useChangeMyPassword = () => useMutation({ mutationFn: changeMyPassword });

export const useDeleteMyAccount = () => {
  const { logout } = useAuth();
  return useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: () => {
      logout();
    },
  });
};
