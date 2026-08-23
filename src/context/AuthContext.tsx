import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  login as loginRequest,
  signup as signupRequest,
  updateDefaultRole,
  type AuthUser,
  type UserRole,
} from "../lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  // True once the initial localStorage read has completed (whether or not a
  // session was found) — the app's "ready to render real content" signal, used
  // to gate the splash screen's minimum-visible timer.
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, university: string, defaultRole: UserRole) => Promise<void>;
  logout: () => void;
  setDefaultRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "ridemate.auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

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
    setHydrated(true);
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

  async function signup(name: string, email: string, password: string, university: string, defaultRole: UserRole) {
    setLoading(true);
    try {
      const { token, user } = await signupRequest(name, email, password, university, defaultRole);
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

  async function setDefaultRole(role: UserRole) {
    if (!token) return;
    const { user: updated } = await updateDefaultRole(role, token);
    setUser(updated);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, user: updated }));
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, hydrated, login, signup, logout, setDefaultRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
