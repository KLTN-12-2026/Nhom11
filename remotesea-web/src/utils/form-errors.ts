import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/services/api-error";

export const applyServerErrors = <T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>
): void => {
  if (!error.fieldErrors) return;

  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    if (messages?.[0]) {
      setError(field as Path<T>, { type: "server", message: messages[0] });
    }
  }
};

/**
 * Standard form submit-failure handling: applies any field-level errors from
 * an ApiError to the form, and returns the top-level message to show. Covers
 * the try/catch shape repeated across every auth/profile form in the app.
 */
export const applyFormSubmitError = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fallbackMessage: string,
  resolveApiMessage?: (apiError: ApiError) => string
): string => {
  if (error instanceof ApiError) {
    applyServerErrors(error, setError);
    return resolveApiMessage?.(error) ?? error.message;
  }
  return fallbackMessage;
};
