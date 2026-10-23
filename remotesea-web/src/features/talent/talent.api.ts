import { apiClient } from "@/services/api-client";
import type { TalentProfile, UpdateTalentProfilePayload } from "@/types/talent";

export const getMyTalentProfile = async (): Promise<TalentProfile> => {
  const { data } = await apiClient.get<TalentProfile>("/talent/me");
  return data;
};

export const updateMyTalentProfile = async (
  payload: UpdateTalentProfilePayload
): Promise<TalentProfile> => {
  const { data } = await apiClient.put<TalentProfile>("/talent/me", payload);
  return data;
};

export const getPublicTalentProfile = async (slug: string): Promise<TalentProfile> => {
  const { data } = await apiClient.get<TalentProfile>(`/talent/${slug}`);
  return data;
};
