import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyTalentProfile, getPublicTalentProfile, updateMyTalentProfile } from "@/features/talent/talent.api";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/services/api-error";

const NOT_FOUND_STATUS = 404;

export const MY_TALENT_PROFILE_KEY = ["talent", "me"];

export const useMyTalentProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: MY_TALENT_PROFILE_KEY,
    queryFn: async () => {
      try {
        return await getMyTalentProfile();
      } catch (err) {
        if (err instanceof ApiError && err.status === NOT_FOUND_STATUS) return null;
        throw err;
      }
    },
    enabled: !!user,
  });
};

export const useUpdateMyTalentProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMyTalentProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(MY_TALENT_PROFILE_KEY, profile);
    },
  });
};

export const usePublicTalentProfile = (slug: string | undefined) =>
  useQuery({
    queryKey: ["talent", "public", slug],
    queryFn: () => getPublicTalentProfile(slug as string),
    enabled: !!slug,
  });
