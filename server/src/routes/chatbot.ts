import { Router } from "express";
import { getChatbotReply } from "../chatbot/engine.js";
import { prisma } from "../prisma.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.post("/message", optionalAuth, async (req, res) => {
  const { message } = req.body ?? {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "A 'message' string is required." });
  }

  const { reply, topicId } = getChatbotReply(message);

  await prisma.chatMessage.create({
    data: { message, reply, topicId, userId: req.user?.sub },
  });

  res.json({ reply, topicId, respondedAt: new Date().toISOString() });
});

export default router;
