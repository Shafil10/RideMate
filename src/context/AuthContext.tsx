import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  login as loginRequest,
  startSignup as startSignupRequest,
  verifySignup as verifySignupRequest,
  startPasswordReset as startPasswordResetRequest,
  verifyPasswordReset as verifyPasswordResetRequest,
  updateDefaultRole,
  type AuthUser,
  type UserRole,
  type VehicleInput,
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
  startSignup: (input: {
    name: string;
    email: string;
    password: string;
    defaultRole: UserRole;
    vehicle?: VehicleInput;
  }) => Promise<{ email: string }>;
  verifySignup: (email: string, code: string) => Promise<void>;
  startPasswordReset: (email: string) => Promise<{ email: string }>;
  verifyPasswordReset: (email: string, code: string, newPassword: string) => Promise<void>;
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

  async function startSignup(input: {
    name: string;
    email: string;
    password: string;
    defaultRole: UserRole;
    vehicle?: VehicleInput;
  }) {
    setLoading(true);
    try {
      return await startSignupRequest(input);
    } finally {
      setLoading(false);
    }
  }

  async function verifySignup(email: string, code: string) {
    setLoading(true);
    try {
      const { token, user } = await verifySignupRequest(email, code);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
      setUser(user);
      setToken(token);
    } finally {
      setLoading(false);
    }
  }

  async function startPasswordReset(email: string) {
    setLoading(true);
    try {
      return await startPasswordResetRequest(email);
    } finally {
      setLoading(false);
    }
  }

  async function verifyPasswordReset(email: string, code: string, newPassword: string) {
    setLoading(true);
    try {
      const { token, user } = await verifyPasswordResetRequest(email, code, newPassword);
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
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        hydrated,
        login,
        startSignup,
        verifySignup,
        startPasswordReset,
        verifyPasswordReset,
        logout,
        setDefaultRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
