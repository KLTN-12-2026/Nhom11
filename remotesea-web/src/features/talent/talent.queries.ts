import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyTalentProfile, getPublicTalentProfile, updateMyTalentProfile } from "@/features/talent/talent.api";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/services/api-error";

export const MY_TALENT_PROFILE_KEY = ["talent", "me"];

export function useMyTalentProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: MY_TALENT_PROFILE_KEY,
    queryFn: async () => {
      try {
        return await getMyTalentProfile();
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: !!user,
  });
}

export function useUpdateMyTalentProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMyTalentProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(MY_TALENT_PROFILE_KEY, profile);
    },
  });
}

export function usePublicTalentProfile(slug: string | undefined) {
  return useQuery({
    queryKey: ["talent", "public", slug],
    queryFn: () => getPublicTalentProfile(slug as string),
    enabled: !!slug,
  });
}
