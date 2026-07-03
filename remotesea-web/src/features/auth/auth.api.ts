import { apiClient } from "@/services/api-client";
import type { AuthUser, UserRole } from "@/types/user";

export type LoginPayload = { email: string; password: string };
export type LoginResponse = { accessToken: string };

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: Extract<UserRole, "TALENT" | "EMPLOYER">;
};
export type RegisterResponse = { id: string; email: string; name: string; role: UserRole };

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>("/auth/register", payload);
  return data;
}

export async function getSession(): Promise<AuthUser | null> {
  const { data } = await apiClient.get<{ user: AuthUser | null }>("/auth/session");
  return data.user;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(payload: {
  token: string;
  password: string;
}): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>("/auth/reset-password", payload);
  return data;
}

export function oauthUrl(provider: "google" | "github"): string {
  const base = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
  return `${base}/auth/${provider}`;
}
