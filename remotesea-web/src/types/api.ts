export type FieldErrors = Record<string, string[]>;

export type ZodFlattenedError = {
  formErrors: string[];
  fieldErrors: FieldErrors;
};

export type ApiErrorBody = {
  error: string | ZodFlattenedError;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};
