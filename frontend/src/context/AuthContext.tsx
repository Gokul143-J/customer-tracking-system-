"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/supabase/database";

export type Role = "admin" | "receptionist" | "section_manager";

export interface UserInfo {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: Role;
  assigned_section?: string;
}

interface AuthCtx {
  user: UserInfo | null;
  loading: boolean;
  loginAdmin: (username: string, password: string) => Promise<UserInfo>;
  loginEmployee: (username: string, password: string) => Promise<UserInfo>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("cts_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const loginAdmin = useCallback(async (username: string, password: string) => {
    const u = await authApi.adminLogin(username, password);
    const info: UserInfo = u as any;
    localStorage.setItem("cts_user", JSON.stringify(info));
    setUser(info);
    return info;
  }, []);

  const loginEmployee = useCallback(async (username: string, password: string) => {
    const u = await authApi.employeeLogin(username, password);
    const info: UserInfo = u as any;
    localStorage.setItem("cts_user", JSON.stringify(info));
    setUser(info);
    return info;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("cts_user");
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, loginAdmin, loginEmployee, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
