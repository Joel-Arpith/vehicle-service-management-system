import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "customer" | "receptionist" | "mechanic" | "manager";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

const TOKEN_KEY = "autocare.token";

/** Fetch wrapper that attaches the bearer token and unwraps API errors. */
export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(path.startsWith("/api") ? path : `/api${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401) {
    // Token expired or revoked — drop it so the guard redirects to /auth
    // rather than looping on requests that will keep failing.
    localStorage.removeItem(TOKEN_KEY);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      body?.message ?? body?.detail?.[0]?.msg ?? `Request failed (${res.status})`,
      res.status,
      body,
    );
  }
  return body as T;
}

export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Starts true: until /auth/me resolves we don't know whether a stored token
  // is still valid, and guarding on `!user` before then would bounce a
  // logged-in user to the login page on every refresh.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const finish = useCallback((res: { user: User; access_token: string }) => {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const login = useCallback(
    (email: string, password: string) =>
      api<{ user: User; access_token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }).then(finish),
    [finish],
  );

  const register = useCallback(
    (name: string, email: string, password: string) =>
      api<{ user: User; access_token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }).then(finish),
    [finish],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Mirrors the backend guards in app/auth.py that the UI actually branches on. */
export const STAFF: Role[] = ["receptionist", "mechanic", "manager"];
export const WORKSHOP: Role[] = ["mechanic", "manager"];

export const can = (user: User | null, roles: Role[]) => !!user && roles.includes(user.role);
