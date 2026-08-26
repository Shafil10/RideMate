import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { signToken, requireAuth } from "../middleware/auth.js";
import { isResendConfigured, sendOtpEmail, sendPasswordResetEmail } from "../email/resend.js";

const router = Router();

const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  university: string;
  defaultRole: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  vehiclePlate: string | null;
  vehicleSeats: number | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    university: user.university,
    defaultRole: user.defaultRole,
    vehicleMake: user.vehicleMake,
    vehicleModel: user.vehicleModel,
    vehicleColor: user.vehicleColor,
    vehiclePlate: user.vehiclePlate,
    vehicleSeats: user.vehicleSeats,
  };
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/signup/start", async (req, res) => {
  const { name, email, password, university, defaultRole, vehicle } = req.body ?? {};

  if (!name || !email || !password || !university) {
    return res.status(400).json({ error: "Name, email, password, and university are required." });
  }

  const role = defaultRole === "driver" ? "driver" : "passenger";
  const normalizedEmail = String(email).toLowerCase();

  if (role === "driver") {
    if (!vehicle || !vehicle.make || !vehicle.model || !vehicle.color || !vehicle.plate || !vehicle.seats) {
      return res.status(400).json({ error: "Vehicle make, model, color, plate, and seats are required for drivers." });
    }
  }

  if (!isResendConfigured()) {
    return res.status(500).json({ error: "Email verification is not configured on the server." });
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const otpCode = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  const vehicleFields =
    role === "driver"
      ? {
          vehicleMake: String(vehicle.make),
          vehicleModel: String(vehicle.model),
          vehicleColor: String(vehicle.color),
          vehiclePlate: String(vehicle.plate),
          vehicleSeats: Number(vehicle.seats),
        }
      : { vehicleMake: null, vehicleModel: null, vehicleColor: null, vehiclePlate: null, vehicleSeats: null };

  await prisma.pendingSignup.upsert({
    where: { email: normalizedEmail },
    create: { email: normalizedEmail, name, passwordHash, university, defaultRole: role, otpCode, otpExpiresAt, attempts: 0, ...vehicleFields },
    update: { name, passwordHash, university, defaultRole: role, otpCode, otpExpiresAt, attempts: 0, ...vehicleFields },
  });

  try {
    await sendOtpEmail(normalizedEmail, name, otpCode);
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    return res.status(502).json({ error: "Couldn't send verification email. Try again shortly." });
  }

  res.json({ message: "Verification code sent.", email: normalizedEmail });
});

router.post("/signup/verify", async (req, res) => {
  const { email, code } = req.body ?? {};

  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required." });
  }

  const normalizedEmail = String(email).toLowerCase();
  const pending = await prisma.pendingSignup.findUnique({ where: { email: normalizedEmail } });

  if (!pending) {
    return res.status(400).json({ error: "No pending signup found for this email. Please sign up again." });
  }

  if (pending.attempts >= MAX_OTP_ATTEMPTS) {
    return res.status(429).json({ error: "Too many attempts. Request a new code." });
  }

  if (pending.otpExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ error: "Code expired. Request a new one." });
  }

  if (String(code) !== pending.otpCode) {
    await prisma.pendingSignup.update({ where: { email: normalizedEmail }, data: { attempts: { increment: 1 } } });
    return res.status(400).json({ error: "Incorrect code." });
  }

  const user = await prisma.user.create({
    data: {
      name: pending.name,
      email: pending.email,
      passwordHash: pending.passwordHash,
      university: pending.university,
      defaultRole: pending.defaultRole,
      vehicleMake: pending.vehicleMake,
      vehicleModel: pending.vehicleModel,
      vehicleColor: pending.vehicleColor,
      vehiclePlate: pending.vehiclePlate,
      vehicleSeats: pending.vehicleSeats,
    },
  });
  await prisma.pendingSignup.delete({ where: { email: normalizedEmail } });

  const token = signToken({ sub: user.id, name: user.name, email: user.email, university: user.university });
  res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });

  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = signToken({ sub: user.id, name: user.name, email: user.email, university: user.university });
  res.json({ token, user: publicUser(user) });
});

router.post("/reset-password/start", async (req, res) => {
  const { email } = req.body ?? {};

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const normalizedEmail = String(email).toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return res.status(404).json({ error: "No account found with that email." });
  }

  if (!isResendConfigured()) {
    return res.status(500).json({ error: "Email verification is not configured on the server." });
  }

  const otpCode = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.passwordReset.upsert({
    where: { email: normalizedEmail },
    create: { email: normalizedEmail, otpCode, otpExpiresAt, attempts: 0 },
    update: { otpCode, otpExpiresAt, attempts: 0 },
  });

  try {
    await sendPasswordResetEmail(normalizedEmail, user.name, otpCode);
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    return res.status(502).json({ error: "Couldn't send verification email. Try again shortly." });
  }

  res.json({ message: "Verification code sent.", email: normalizedEmail });
});

router.post("/reset-password/verify", async (req, res) => {
  const { email, code, newPassword } = req.body ?? {};

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: "Email, code, and new password are required." });
  }

  const normalizedEmail = String(email).toLowerCase();
  const pending = await prisma.passwordReset.findUnique({ where: { email: normalizedEmail } });

  if (!pending) {
    return res.status(400).json({ error: "No pending password reset found for this email. Please request a new code." });
  }

  if (pending.attempts >= MAX_OTP_ATTEMPTS) {
    return res.status(429).json({ error: "Too many attempts. Request a new code." });
  }

  if (pending.otpExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ error: "Code expired. Request a new one." });
  }

  if (String(code) !== pending.otpCode) {
    await prisma.passwordReset.update({ where: { email: normalizedEmail }, data: { attempts: { increment: 1 } } });
    return res.status(400).json({ error: "Incorrect code." });
  }

  const passwordHash = await bcrypt.hash(String(newPassword), 10);
  const user = await prisma.user.update({ where: { email: normalizedEmail }, data: { passwordHash } });
  await prisma.passwordReset.delete({ where: { email: normalizedEmail } });

  const token = signToken({ sub: user.id, name: user.name, email: user.email, university: user.university });
  res.json({ token, user: publicUser(user) });
});

// Updates which home screen/tab set a user lands on after login. Never checked as
// a permission gate anywhere — any authenticated user can still offer or request a
// ride regardless of this value.
router.patch("/me", requireAuth, async (req, res) => {
  const { defaultRole } = req.body ?? {};

  if (defaultRole !== "passenger" && defaultRole !== "driver") {
    return res.status(400).json({ error: "defaultRole must be \"passenger\" or \"driver\"." });
  }

  const user = await prisma.user.update({
    where: { id: req.user!.sub },
    data: { defaultRole },
  });

  res.json({ user: publicUser(user) });
});

export default router;
