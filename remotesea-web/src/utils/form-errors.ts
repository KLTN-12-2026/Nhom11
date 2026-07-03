import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ApiError } from "@/services/api-error";

export function applyServerErrors<T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>
): void {
  if (!error.fieldErrors) return;
  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    if (messages?.[0]) {
      setError(field as Path<T>, { type: "server", message: messages[0] });
    }
  }
}
