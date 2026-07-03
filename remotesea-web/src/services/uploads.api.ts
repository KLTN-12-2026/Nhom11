import { apiClient } from "@/services/api-client";

export type UploadType = "avatar" | "logo" | "resume";

export async function uploadViaPresign(file: File, type: UploadType): Promise<string> {
  const { data } = await apiClient.post<{ uploadUrl: string; publicUrl: string; key: string }>(
    "/uploads/presign",
    { type, filename: file.name, contentType: file.type }
  );

  const put = await fetch(data.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!put.ok) throw new Error("Upload failed");

  return data.publicUrl;
}
