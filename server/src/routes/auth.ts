import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { signToken } from "../middleware/auth.js";

const router = Router();

function publicUser(user: { id: string; name: string; email: string; university: string }) {
  return { id: user.id, name: user.name, email: user.email, university: user.university };
}

router.post("/signup", async (req, res) => {
  const { name, email, password, university } = req.body ?? {};

  if (!name || !email || !password || !university) {
    return res.status(400).json({ error: "Name, email, password, and university are required." });
  }

  const existing = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = await prisma.user.create({
    data: { name, email: String(email).toLowerCase(), passwordHash, university },
  });

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

export default router;
