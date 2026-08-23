import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Car, GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../lib/api";
import { Button, Input } from "../components/ui";
import { hapticTap } from "../lib/haptics";

export default function LoginPage() {
  const { login, signup, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<UserRole | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [error, setError] = useState<string | null>(null);

  const stateFrom = (location.state as { from?: string } | null)?.from;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "signup") {
        await signup(name, email, password, university, role ?? "passenger");
      } else {
        await login(email, password);
      }
      navigate(stateFrom ?? (role === "driver" ? "/driver" : "/passenger"), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-background">
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {!role ? (
            <motion.div
              key="role-select"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-5"
            >
              <div className="text-center mb-1">
                <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
                  <span className="font-display text-2xl font-extrabold text-white">R</span>
                </div>
                <h1 className="font-display text-2xl font-extrabold text-text">Welcome to RideMate</h1>
                <p className="text-text-muted text-sm mt-1">How will you be using RideMate?</p>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  hapticTap();
                  setRole("passenger");
                }}
                className="flex items-center gap-4 rounded-3xl border-2 border-primary bg-primary-light p-5 text-left"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                  <GraduationCap size={24} className="text-white" />
                </div>
                <div>
                  <div className="font-display font-bold text-text">I'm a Passenger</div>
                  <div className="text-xs text-text-muted mt-0.5">Find and join rides to campus</div>
                </div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  hapticTap();
                  setRole("driver");
                }}
                className="flex items-center gap-4 rounded-3xl border-2 border-driver bg-driver-light p-5 text-left"
              >
                <div className="h-12 w-12 rounded-2xl bg-driver flex items-center justify-center shrink-0">
                  <Car size={24} className="text-white" />
                </div>
                <div>
                  <div className="font-display font-bold text-text">I offer rides</div>
                  <div className="text-xs text-text-muted mt-0.5">Drive and pick up fellow students</div>
                </div>
              </motion.button>

              <Link to="/" className="text-center text-sm text-text-muted font-semibold mt-2">
                ← Back to home
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <button
                onClick={() => setRole(null)}
                className="flex items-center gap-1 text-sm font-semibold text-text-muted mb-5"
              >
                <ArrowLeft size={16} /> Change role
              </button>

              <h1 className="font-display text-2xl font-extrabold text-text mb-1">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-text-muted text-sm mb-6">
                {mode === "login"
                  ? `Log in as a ${role === "driver" ? "driver" : "passenger"} with your university email.`
                  : `Sign up as a ${role === "driver" ? "driver" : "passenger"} with your university email.`}
              </p>

              {error && (
                <div className="bg-danger-light text-danger text-sm font-medium rounded-xl px-4 py-3 mb-4">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {mode === "signup" && (
                  <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
                )}
                <Input
                  label="University email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  required
                />
                {mode === "signup" && (
                  <Input
                    label="University"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="e.g. North South University"
                    required
                  />
                )}
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                <Button
                  type="submit"
                  variant={role === "driver" ? "driver" : "primary"}
                  loading={loading}
                  fullWidth
                  className="mt-2"
                >
                  {mode === "login" ? "Log in" : "Sign up"}
                </Button>
              </form>

              <p className="mt-5 text-sm text-text-muted text-center">
                {mode === "login" ? (
                  <>
                    New to RideMate?{" "}
                    <button type="button" onClick={() => { setMode("signup"); setError(null); }} className="text-primary font-semibold">
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button type="button" onClick={() => { setMode("login"); setError(null); }} className="text-primary font-semibold">
                      Log in
                    </button>
                  </>
                )}
              </p>

              {mode === "login" && (
                <p className="mt-2 text-xs text-text-muted text-center">
                  Demo account: <code>demo@ridemate.app</code> / <code>demo1234</code>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
