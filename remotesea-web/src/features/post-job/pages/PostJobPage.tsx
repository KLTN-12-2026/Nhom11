import { PostJobWizard } from "@/features/post-job/components/PostJobWizard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export const PostJobPage = () => {
  useDocumentTitle("Post a Remote Job");
  return <PostJobWizard />;
};
