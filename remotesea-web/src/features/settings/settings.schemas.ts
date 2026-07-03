import { z } from "zod";

export const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
