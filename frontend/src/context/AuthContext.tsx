"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  authApi,
  setStoredUser,
  setToken as persistToken,
  getStoredUser,
} from "@/lib/api";
import type { UserInfo } from "@/types";

interface AuthCtx {
  user: UserInfo | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserInfo>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const t = localStorage.getItem("jwt_token");
    const u = getStoredUser<UserInfo>();
    if (t) setTokenState(t);
    if (u) setUser(u);
    setLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(email, password);
      const tok: string = res.access_token;
      const u: UserInfo = res.user ?? {
        id: "",
        email,
        full_name: email.split("@")[0],
        role: "admin",
        store_id: "",
      };
      persistToken(tok);
      setStoredUser(u);
      setTokenState(tok);
      setUser(u);
      return u;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      if (token) await authApi.logout();
    } catch {}
    persistToken(null);
    setStoredUser(null);
    setTokenState(null);
    setUser(null);
    router.push("/login");
  }, [router, token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
