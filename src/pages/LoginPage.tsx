import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, signup, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [error, setError] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/rides";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "signup") {
        await signup(name, email, password, university);
      } else {
        await login(email, password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "120px 24px 80px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#f9fafb",
          borderRadius: 16,
          padding: 32,
          border: "1px solid #ececec",
        }}
      >
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p style={{ color: "#555", marginBottom: 24, fontSize: 14 }}>
          {mode === "login"
            ? "Log in with your university email to create or join rides."
            : "Sign up with your university email to start creating or joining rides."}
        </p>

        {error && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          {mode === "signup" && (
            <label style={{ display: "grid", gap: 6, fontSize: 14, fontWeight: 600 }}>
              Full name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                style={inputStyle}
              />
            </label>
          )}

          <label style={{ display: "grid", gap: 6, fontSize: 14, fontWeight: 600 }}>
            University email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              required
              style={inputStyle}
            />
          </label>

          {mode === "signup" && (
            <label style={{ display: "grid", gap: 6, fontSize: 14, fontWeight: 600 }}>
              University
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. North South University"
                required
                style={inputStyle}
              />
            </label>
          )}

          <label style={{ display: "grid", gap: 6, fontSize: 14, fontWeight: 600 }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              background: "#16a34a",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: 30,
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (mode === "login" ? "Logging in..." : "Signing up...") : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 13, color: "#555" }}>
          {mode === "login" ? (
            <>
              New to RideMate?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                style={linkButtonStyle}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                style={linkButtonStyle}
              >
                Log in
              </button>
            </>
          )}
        </p>

        {mode === "login" && (
          <p style={{ marginTop: 8, fontSize: 13, color: "#555" }}>
            Demo account: <code>demo@ridemate.app</code> / <code>demo1234</code>
          </p>
        )}

        <p style={{ marginTop: 12, fontSize: 13 }}>
          <Link to="/" style={{ color: "#16a34a", fontWeight: 600, textDecoration: "none" }}>
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14,
  fontWeight: 400,
};

const linkButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  color: "#16a34a",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  textDecoration: "underline",
};
