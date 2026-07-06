import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

const hydrateFromSession = async (): Promise<AuthUser | null> => {
  try {
    return await authApi.getSession();
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    getAccessToken() ? "loading" : "unauthenticated"
  );

  useEffect(() => {
    if (!getAccessToken()) return;
    hydrateFromSession().then((sessionUser) => {
      setUser(sessionUser);
      setStatus(sessionUser ? "authenticated" : "unauthenticated");
    });
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setUser(null);
      setStatus("unauthenticated");
    });
  }, []);

  const loginWithToken = useCallback(async (token: string, remember = true) => {
    setAccessToken(token, remember);
    const sessionUser = await hydrateFromSession();
    setUser(sessionUser);
    setStatus(sessionUser ? "authenticated" : "unauthenticated");
    if (!sessionUser) throw new Error("Could not load session after authentication");
    return sessionUser;
  }, []);

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
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const patchUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

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
