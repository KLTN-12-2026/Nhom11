import { apiClient } from "@/services/api-client";
import type { AuthUser } from "@/types/user";

type UpdatedUser = Pick<AuthUser, "id" | "name" | "email">;
export type ChangePasswordPayload = { currentPassword: string; newPassword: string };

export const updateMyName = async (name: string): Promise<UpdatedUser> => {
  const { data } = await apiClient.patch<UpdatedUser>("/users/me", { name });
  return data;
};

export const changeMyPassword = async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>("/users/me/password", payload);
  return data;
};

export const deleteMyAccount = async (): Promise<{ success: boolean }> => {
  const { data } = await apiClient.delete<{ success: boolean }>("/users/me");
  return data;
};
