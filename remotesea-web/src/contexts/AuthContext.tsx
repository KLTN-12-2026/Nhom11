import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "@/features/auth/auth.api";
import { registerUnauthorizedHandler } from "@/services/api-client";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/services/token-storage";
import type { AuthUser, UserRole } from "@/types/user";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: Extract<UserRole, "TALENT" | "EMPLOYER">;
};

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthUser>;
  loginWithToken: (token: string) => Promise<AuthUser>;
  registerAccount: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => void;
  patchUser: (partial: Partial<AuthUser>) => void;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// The session is auth's own cache, not a regular feature query — kept here rather than
// in a `.queries.ts` file since AuthContext is the single place that owns writes to it.
const SESSION_KEY = ["session"];

const hydrateFromSession = async (): Promise<AuthUser | null> => {
  try {
    return await authApi.getSession();
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(() => !!getAccessToken());

  const sessionQuery = useQuery({
    queryKey: SESSION_KEY,
    queryFn: hydrateFromSession,
    enabled: hasToken,
    staleTime: Infinity,
    retry: false,
  });

  const user = sessionQuery.data ?? null;
  const status: AuthStatus = !hasToken
    ? "unauthenticated"
    : sessionQuery.isLoading
      ? "loading"
      : user
        ? "authenticated"
        : "unauthenticated";

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      queryClient.setQueryData(SESSION_KEY, null);
      setHasToken(false);
    });
  }, [queryClient]);

  const loginWithToken = useCallback(
    async (token: string, remember = true) => {
      setAccessToken(token, remember);
      const sessionUser = await hydrateFromSession();
      queryClient.setQueryData(SESSION_KEY, sessionUser);
      setHasToken(true);
      if (!sessionUser) throw new Error("Could not load session after authentication");
      return sessionUser;
    },
    [queryClient]
  );

  const login = useCallback(
    async (email: string, password: string, remember = true) => {
      const { accessToken } = await authApi.login({ email, password });
      return loginWithToken(accessToken, remember);
    },
    [loginWithToken]
  );

  const registerAccount = useCallback(
    async (input: RegisterInput) => {
      await authApi.register(input);
      return login(input.email, input.password, true);
    },
    [login]
  );

  const logout = useCallback(() => {
    clearAccessToken();
    queryClient.setQueryData(SESSION_KEY, null);
    setHasToken(false);
  }, [queryClient]);

  const patchUser = useCallback(
    (partial: Partial<AuthUser>) => {
      queryClient.setQueryData<AuthUser | null>(SESSION_KEY, (prev) =>
        prev ? { ...prev, ...partial } : prev
      );
    },
    [queryClient]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, loginWithToken, registerAccount, logout, patchUser }),
    [user, status, login, loginWithToken, registerAccount, logout, patchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
