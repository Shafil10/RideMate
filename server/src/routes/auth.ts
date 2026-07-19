import { Router } from "express";
import { users } from "../data.js";

const router = Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, university: user.university },
  });
});

export default router;
