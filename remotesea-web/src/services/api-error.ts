import type { ApiErrorBody, FieldErrors, ZodFlattenedError } from "@/types/api";

function isZodFlattenedError(value: unknown): value is ZodFlattenedError {
  return typeof value === "object" && value !== null && "fieldErrors" in value;
}

function firstFieldError(fieldErrors: FieldErrors): string | undefined {
  const firstKey = Object.keys(fieldErrors)[0];
  return firstKey ? fieldErrors[firstKey]?.[0] : undefined;
}

function parseErrorBody(body: unknown): {
  message: string;
  fieldErrors?: FieldErrors;
  formErrors?: string[];
} {
  if (body && typeof body === "object" && "error" in body) {
    const { error } = body as ApiErrorBody;
    if (typeof error === "string") return { message: error };
    if (isZodFlattenedError(error)) {
      const message = error.formErrors[0] ?? firstFieldError(error.fieldErrors) ?? "Validation failed";
      return { message, fieldErrors: error.fieldErrors, formErrors: error.formErrors };
    }
  }
  return { message: "Something went wrong. Please try again." };
}

export class ApiError extends Error {
  status: number;
  fieldErrors?: FieldErrors;
  formErrors?: string[];

  constructor(status: number, body: unknown) {
    const parsed = parseErrorBody(body);
    super(parsed.message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = parsed.fieldErrors;
    this.formErrors = parsed.formErrors;
  }
}
