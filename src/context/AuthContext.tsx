import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { login as loginRequest, signup as signupRequest, type AuthUser } from "../lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, university: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "ridemate.auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  async function login(email: string, password: string) {
    setLoading(true);
    try {
      const { token, user } = await loginRequest(email, password);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
      setUser(user);
      setToken(token);
    } finally {
      setLoading(false);
    }
  }

  async function signup(name: string, email: string, password: string, university: string) {
    setLoading(true);
    try {
      const { token, user } = await signupRequest(name, email, password, university);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
      setUser(user);
      setToken(token);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
