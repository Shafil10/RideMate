import { Router } from "express";
import { chatbotSuggestions, getChatbotReply } from "../chatbot/engine.js";
import { prisma } from "../prisma.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get("/suggestions", (_req, res) => {
  res.json({ suggestions: chatbotSuggestions });
});

router.post("/message", optionalAuth, async (req, res) => {
  const { message } = req.body ?? {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "A 'message' string is required." });
  }

  const { reply, topicId, suggestions } = getChatbotReply(message);

  await prisma.chatMessage.create({
    data: { message, reply, topicId, userId: req.user?.sub },
  });

  res.json({ reply, topicId, suggestions, respondedAt: new Date().toISOString() });
});

export default router;
