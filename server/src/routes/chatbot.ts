import { Router } from "express";
import { getChatbotReply } from "../chatbot/engine.js";

const router = Router();

router.post("/message", (req, res) => {
  const { message } = req.body ?? {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "A 'message' string is required." });
  }

  const { reply, topicId } = getChatbotReply(message);
  res.json({ reply, topicId, respondedAt: new Date().toISOString() });
});

export default router;
