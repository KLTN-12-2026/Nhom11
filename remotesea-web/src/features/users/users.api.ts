import { apiClient } from "@/services/api-client";
import type { AuthUser } from "@/types/user";

export async function updateMyName(name: string): Promise<Pick<AuthUser, "id" | "name" | "email">> {
  const { data } = await apiClient.patch<Pick<AuthUser, "id" | "name" | "email">>("/users/me", {
    name,
  });
  return data;
}

export async function changeMyPassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>("/users/me/password", payload);
  return data;
}

export async function deleteMyAccount(): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean }>("/users/me");
  return data;
}
