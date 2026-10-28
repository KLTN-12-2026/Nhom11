import { z } from "zod";

export const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

export const accountNameFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Keep it under 120 characters"),
});
export type AccountNameFormValues = z.infer<typeof accountNameFormSchema>;
