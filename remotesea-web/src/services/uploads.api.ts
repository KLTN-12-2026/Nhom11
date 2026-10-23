import { apiClient } from "@/services/api-client";

export type UploadType = "avatar" | "logo" | "resume";

type PresignResponse = { uploadUrl: string; publicUrl: string; key: string };

export const uploadViaPresign = async (file: File, type: UploadType): Promise<string> => {
  const { data } = await apiClient.post<PresignResponse>("/uploads/presign", {
    type,
    filename: file.name,
    contentType: file.type,
  });

  const response = await fetch(data.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!response.ok) throw new Error("Upload failed");

  return data.publicUrl;
};
