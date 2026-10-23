import { ProfileForm } from "@/features/talent/components/ProfileForm";
import { useMyTalentProfile } from "@/features/talent/talent.queries";
import { FullPageLoader } from "@/components/ui/spinner";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export const ProfilePage = () => {
  useDocumentTitle("Profile Setup");
  const { data: profile, isLoading } = useMyTalentProfile();

  if (isLoading) return <FullPageLoader />;

  return <ProfileForm profile={profile ?? null} />;
};
