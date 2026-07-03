import { apiClient } from "@/services/api-client";
import type { TalentProfile, UpdateTalentProfilePayload } from "@/types/talent";

export async function getMyTalentProfile(): Promise<TalentProfile> {
  const { data } = await apiClient.get<TalentProfile>("/talent/me");
  return data;
}

export async function updateMyTalentProfile(
  payload: UpdateTalentProfilePayload
): Promise<TalentProfile> {
  const { data } = await apiClient.put<TalentProfile>("/talent/me", payload);
  return data;
}

export async function getPublicTalentProfile(slug: string): Promise<TalentProfile> {
  const { data } = await apiClient.get<TalentProfile>(`/talent/${slug}`);
  return data;
}
