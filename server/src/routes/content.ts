import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

router.get("/stats", async (_req, res) => {
  const stats = await prisma.stat.findMany({ orderBy: { order: "asc" } });
  res.json({ stats: stats.map((s) => ({ value: s.value, label: s.label })) });
});

router.get("/universities", async (_req, res) => {
  const universities = await prisma.university.findMany({ orderBy: { order: "asc" } });
  res.json({ universities: universities.map((u) => u.name) });
});

router.get("/testimonials", async (_req, res) => {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { order: "asc" } });
  res.json({ testimonials: testimonials.map((t) => ({ name: t.name, text: t.text })) });
});

export default router;
