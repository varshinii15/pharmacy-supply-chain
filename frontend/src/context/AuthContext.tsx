"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, RegisterPayload, User } from "@/lib/api";
import Cookies from "js-cookie";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

function formatUser(rawUser: any): User {
  return {
    ...rawUser,
    id: rawUser.id || rawUser._id,
    _id: rawUser.id || rawUser._id,
    participantId: rawUser.participant?.walletAddress || rawUser.participantId,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const t = Cookies.get("token");
    if (!t) {
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.me();
      if (res.data.success && res.data.data?.user) {
        setUser(formatUser(res.data.data.user));
        setToken(t);
      } else {
        Cookies.remove("token");
      }
    } catch {
      Cookies.remove("token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || "Login failed");
    }
    const { token: t, user: u } = res.data.data;
    Cookies.set("token", t, { expires: 7, sameSite: "Lax" });
    setToken(t);
    setUser(formatUser(u));
  };

  const register = async (payload: RegisterPayload) => {
    const res = await authApi.register(payload);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || "Registration failed");
    }
    const { token: t, user: u } = res.data.data;
    Cookies.set("token", t, { expires: 7, sameSite: "Lax" });
    setToken(t);
    setUser(formatUser(u));
  };

  const logout = () => {
    Cookies.remove("token");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
