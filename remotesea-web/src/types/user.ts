export type UserRole = "TALENT" | "EMPLOYER" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};
