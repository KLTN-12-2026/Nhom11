import { apiClient } from "@/services/api-client";

export type UploadType = "avatar" | "logo" | "resume";

type PresignResponse = { uploadUrl: string; publicUrl: string; key: string };

// Mirrors remotesea-api's src/modules/uploads/constants.ts exactly, so the client
// rejects an invalid file with a specific message before it ever reaches the
// network — the server-side allowlist is still the real enforcement boundary.
const CONTENT_TYPES: Record<UploadType, readonly string[]> = {
  avatar: ["image/jpeg", "image/png", "image/webp"],
  logo: ["image/jpeg", "image/png", "image/webp"],
  resume: ["application/pdf"],
};

const BYTES_PER_MB = 1024 * 1024;

export const MAX_FILE_SIZE_BYTES: Record<UploadType, number> = {
  avatar: 5 * BYTES_PER_MB,
  logo: 5 * BYTES_PER_MB,
  resume: 10 * BYTES_PER_MB,
};

export const validateFile = (file: File, type: UploadType): string | null => {
  if (!CONTENT_TYPES[type].includes(file.type)) {
    return type === "resume" ? "Must be a PDF file." : "Must be a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES[type]) {
    return `File too large — max ${MAX_FILE_SIZE_BYTES[type] / BYTES_PER_MB}MB.`;
  }
  return null;
};

export const uploadViaPresign = async (file: File, type: UploadType): Promise<string> => {
  const { data } = await apiClient.post<PresignResponse>("/uploads/presign", {
    type,
    filename: file.name,
    contentType: file.type,
    fileSize: file.size,
  });

  const response = await fetch(data.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!response.ok) throw new Error("Upload failed");

  return data.publicUrl;
};
