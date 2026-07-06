import { apiClient } from "@/services/api-client";
import type { Category, Skill } from "@/types/job";

export const listCategories = async (): Promise<Category[]> => {
  const { data } = await apiClient.get<Category[]>("/categories");
  return data;
};

export const listSkills = async (q?: string): Promise<Skill[]> => {
  const { data } = await apiClient.get<Skill[]>("/skills", { params: q ? { q } : undefined });
  return data;
};
