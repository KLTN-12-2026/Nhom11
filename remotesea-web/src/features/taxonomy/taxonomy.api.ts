import { apiClient } from "@/services/api-client";
import type { Category, Skill } from "@/types/job";

export async function listCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>("/categories");
  return data;
}

export async function listSkills(q?: string): Promise<Skill[]> {
  const { data } = await apiClient.get<Skill[]>("/skills", { params: q ? { q } : undefined });
  return data;
}
