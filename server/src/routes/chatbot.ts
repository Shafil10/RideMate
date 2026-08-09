import { Router } from "express";
import { getChatbotReply } from "../chatbot/engine.js";
import { getAiChatbotReply, isGeminiConfigured } from "../chatbot/groq.js";
import { prisma } from "../prisma.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.post("/message", optionalAuth, async (req, res) => {
  const { message, sessionId } = req.body ?? {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "A 'message' string is required." });
  }
  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "A 'sessionId' string is required." });
  }

  let reply: string;
  let topicId: string;

  if (isGeminiConfigured()) {
    try {
      const history = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: "asc" },
        take: 10,
        select: { message: true, reply: true },
      });
      ({ reply, topicId } = await getAiChatbotReply(message, history));
    } catch (err) {
      console.error("Gemini chatbot call failed, falling back to rule-based engine:", err);
      ({ reply, topicId } = getChatbotReply(message));
    }
  } else {
    ({ reply, topicId } = getChatbotReply(message));
  }

  await prisma.chatMessage.create({
    data: { sessionId, message, reply, topicId, userId: req.user?.sub },
  });

  res.json({ reply, topicId, respondedAt: new Date().toISOString() });
});

export default router;
