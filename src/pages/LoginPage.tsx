import { useState } from "react";
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Car, GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../lib/api";
import { Button, Input } from "../components/ui";
import { hapticTap, hapticSuccess } from "../lib/haptics";

type Step = "role" | "form" | "vehicle" | "otp" | "forgot" | "reset-otp";

const RESEND_COOLDOWN_SECONDS = 30;

export default function LoginPage() {
  const { user, login, startSignup, verifySignup, startPasswordReset, verifyPasswordReset, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleSeats, setVehicleSeats] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const stateFrom = (location.state as { from?: string } | null)?.from;

  if (user) {
    return <Navigate to={user.defaultRole === "driver" ? "/driver" : "/passenger"} replace />;
  }

  function startResendCooldown() {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    const interval = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function sendSignupOtp(vehicle?: { make: string; model: string; color: string; plate: string; seats: number }) {
    setError(null);
    try {
      const { email: sentTo } = await startSignup({
        name,
        email,
        password,
        defaultRole: role ?? "passenger",
        vehicle,
      });
      hapticTap();
      setOtpEmail(sentTo);
      setOtpCode("");
      startResendCooldown();
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "login") {
      try {
        await login(email, password);
        navigate(stateFrom ?? (role === "driver" ? "/driver" : "/passenger"), { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
      return;
    }

    if (role === "driver") {
      hapticTap();
      setStep("vehicle");
      return;
    }

    await sendSignupOtp();
  }

  async function handleVehicleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const seats = Number(vehicleSeats);
    if (!vehicleMake || !vehicleModel || !vehicleColor || !vehiclePlate || !seats) {
      setError("All vehicle details are required.");
      return;
    }
    await sendSignupOtp({ make: vehicleMake, model: vehicleModel, color: vehicleColor, plate: vehiclePlate, seats });
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await verifySignup(otpEmail, otpCode);
      hapticSuccess();
      navigate(stateFrom ?? (role === "driver" ? "/driver" : "/passenger"), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function sendResetCode() {
    setError(null);
    try {
      const { email: sentTo } = await startPasswordReset(resetEmail);
      hapticTap();
      setResetEmail(sentTo);
      setResetCode("");
      startResendCooldown();
      setStep("reset-otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendResetCode();
  }

  async function handleResetVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      // Updates the AuthContext user, which flips the already-authenticated
      // guard above on the next render — no manual navigate needed, and it
      // correctly uses the verified user's own defaultRole.
      await verifyPasswordReset(resetEmail, resetCode, newPassword);
      hapticSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-background">
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {step === "role" ? (
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
                  setStep("form");
                }}
                className="flex items-center gap-4 rounded-3xl border-2 border-primary bg-primary-light p-5 text-left"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                  <GraduationCap size={24} className="text-white" />
                </div>
                <div>
                  <div className="font-display font-bold text-text">I'm a Passenger</div>
                  <div className="text-xs text-primary-dark mt-0.5">Find and join rides to campus</div>
                </div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  hapticTap();
                  setRole("driver");
                  setStep("form");
                }}
                className="flex items-center gap-4 rounded-3xl border-2 border-driver bg-driver-light p-5 text-left"
              >
                <div className="h-12 w-12 rounded-2xl bg-driver flex items-center justify-center shrink-0">
                  <Car size={24} className="text-white" />
                </div>
                <div>
                  <div className="font-display font-bold text-text">I offer rides</div>
                  <div className="text-xs text-driver-dark mt-0.5">Drive and pick up fellow students</div>
                </div>
              </motion.button>

              <Link to="/about" className="text-center text-sm text-text-muted font-semibold mt-2">
                Learn more about RideMate →
              </Link>
            </motion.div>
          ) : step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <button
                onClick={() => {
                  setRole(null);
                  setStep("role");
                  setError(null);
                }}
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
                  <p className="text-xs text-text-muted -mt-2">
                    Your university is detected automatically from this email — sign up with the one your school gave you.
                  </p>
                )}
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setError(null);
                      setStep("forgot");
                    }}
                    className="self-end text-xs text-text-muted font-semibold -mt-2"
                  >
                    Forgot password?
                  </button>
                )}

                <Button
                  type="submit"
                  variant={role === "driver" ? "driver" : "primary"}
                  loading={loading}
                  fullWidth
                  className="mt-2"
                >
                  {mode === "login" ? "Log in" : role === "driver" ? "Continue" : "Sign up"}
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
          ) : step === "vehicle" ? (
            <motion.div
              key="vehicle"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <button
                onClick={() => {
                  setStep("form");
                  setError(null);
                }}
                className="flex items-center gap-1 text-sm font-semibold text-text-muted mb-5"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <h1 className="font-display text-2xl font-extrabold text-text mb-1">Your vehicle</h1>
              <p className="text-text-muted text-sm mb-6">
                Tell riders what to look for — this shows on your driver profile.
              </p>

              {error && (
                <div className="bg-danger-light text-danger text-sm font-medium rounded-xl px-4 py-3 mb-4">{error}</div>
              )}

              <form onSubmit={handleVehicleSubmit} className="flex flex-col gap-4">
                <Input label="Make" value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} placeholder="e.g. Toyota" required />
                <Input label="Model" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="e.g. Axio" required />
                <Input label="Color" value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} placeholder="e.g. White" required />
                <Input
                  label="License plate"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="e.g. DHA-1234"
                  required
                />
                <Input
                  label="Seats available"
                  type="number"
                  min={1}
                  max={8}
                  value={vehicleSeats}
                  onChange={(e) => setVehicleSeats(e.target.value)}
                  placeholder="e.g. 4"
                  required
                />

                <Button type="submit" variant="driver" loading={loading} fullWidth className="mt-2">
                  Continue
                </Button>
              </form>
            </motion.div>
          ) : step === "otp" ? (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <button
                onClick={() => {
                  setStep(role === "driver" ? "vehicle" : "form");
                  setError(null);
                }}
                className="flex items-center gap-1 text-sm font-semibold text-text-muted mb-5"
              >
                <ArrowLeft size={16} /> Edit details
              </button>

              <h1 className="font-display text-2xl font-extrabold text-text mb-1">Verify your email</h1>
              <p className="text-text-muted text-sm mb-6">We sent a 6-digit code to {otpEmail}.</p>

              {error && (
                <div className="bg-danger-light text-danger text-sm font-medium rounded-xl px-4 py-3 mb-4">{error}</div>
              )}

              <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
                <Input
                  label="Verification code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  required
                  className="text-center text-2xl font-bold tracking-[0.5em]"
                />

                <Button
                  type="submit"
                  variant={role === "driver" ? "driver" : "primary"}
                  loading={loading}
                  disabled={otpCode.length !== 6}
                  fullWidth
                  className="mt-2"
                >
                  Verify
                </Button>
              </form>

              <p className="mt-5 text-sm text-text-muted text-center">
                Didn't get it?{" "}
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={() => sendSignupOtp(role === "driver" ? { make: vehicleMake, model: vehicleModel, color: vehicleColor, plate: vehiclePlate, seats: Number(vehicleSeats) } : undefined)}
                  className="text-primary font-semibold disabled:text-text-muted disabled:font-medium"
                >
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
                </button>
              </p>
            </motion.div>
          ) : step === "forgot" ? (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <button
                onClick={() => {
                  setStep("form");
                  setMode("login");
                  setError(null);
                }}
                className="flex items-center gap-1 text-sm font-semibold text-text-muted mb-5"
              >
                <ArrowLeft size={16} /> Back to login
              </button>

              <h1 className="font-display text-2xl font-extrabold text-text mb-1">Reset your password</h1>
              <p className="text-text-muted text-sm mb-6">Enter your account email and we'll send you a code.</p>

              {error && (
                <div className="bg-danger-light text-danger text-sm font-medium rounded-xl px-4 py-3 mb-4">{error}</div>
              )}

              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                <Input
                  label="University email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@university.edu"
                  required
                />

                <Button type="submit" variant="primary" loading={loading} fullWidth className="mt-2">
                  Send code
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="reset-otp"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <button
                onClick={() => {
                  setStep("forgot");
                  setError(null);
                }}
                className="flex items-center gap-1 text-sm font-semibold text-text-muted mb-5"
              >
                <ArrowLeft size={16} /> Edit email
              </button>

              <h1 className="font-display text-2xl font-extrabold text-text mb-1">Check your email</h1>
              <p className="text-text-muted text-sm mb-6">Enter the 6-digit code sent to {resetEmail} and choose a new password.</p>

              {error && (
                <div className="bg-danger-light text-danger text-sm font-medium rounded-xl px-4 py-3 mb-4">{error}</div>
              )}

              <form onSubmit={handleResetVerifySubmit} className="flex flex-col gap-4">
                <Input
                  label="Verification code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  required
                  className="text-center text-2xl font-bold tracking-[0.5em]"
                />
                <Input
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  disabled={resetCode.length !== 6}
                  fullWidth
                  className="mt-2"
                >
                  Reset password
                </Button>
              </form>

              <p className="mt-5 text-sm text-text-muted text-center">
                Didn't get it?{" "}
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={() => sendResetCode()}
                  className="text-primary font-semibold disabled:text-text-muted disabled:font-medium"
                >
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
