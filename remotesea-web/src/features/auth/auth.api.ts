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

export type ResetPasswordPayload = { token: string; password: string };
export type OAuthProvider = "google" | "github";

const DEFAULT_API_URL = "http://localhost:4000";

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
};

export const register = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const { data } = await apiClient.post<RegisterResponse>("/auth/register", payload);
  return data;
};

export const getSession = async (): Promise<AuthUser | null> => {
  const { data } = await apiClient.get<{ user: AuthUser | null }>("/auth/session");
  return data.user;
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>("/auth/forgot-password", { email });
  return data;
};

export const resetPassword = async (payload: ResetPasswordPayload): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>("/auth/reset-password", payload);
  return data;
};

export const oauthUrl = (provider: OAuthProvider): string => {
  const base = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;
  return `${base}/auth/${provider}`;
};
