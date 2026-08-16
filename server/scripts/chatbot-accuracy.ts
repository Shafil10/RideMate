// One-off evaluation script (deferred from Sprint 4): compares the rule-based
// chatbot engine against the real LLM (Groq) on a fixed FAQ test set.
// Run with: npx tsx scripts/chatbot-accuracy.ts
import "dotenv/config";
import { getChatbotReply } from "../src/chatbot/engine.js";
import { getAiChatbotReply, isGeminiConfigured } from "../src/chatbot/groq.js";

interface TestCase {
  question: string;
  expectedTopic: string;
  // Any one of these terms appearing in the AI reply counts as "on-topic" for that fact.
  expectedKeywords?: string[];
  offTopic?: boolean;
}

const cases: TestCase[] = [
  { question: "How do I create a ride?", expectedTopic: "create-ride", expectedKeywords: ["create ride", "departure", "seats", "fare"] },
  { question: "I want to post a ride as a driver, how does that work?", expectedTopic: "create-ride", expectedKeywords: ["create ride", "route", "seats"] },
  { question: "How can I join a ride?", expectedTopic: "join-ride", expectedKeywords: ["rides page", "join", "browse"] },
  { question: "Where do I search for available rides?", expectedTopic: "join-ride", expectedKeywords: ["rides page", "filter", "join"] },
  { question: "How much does a ride cost?", expectedTopic: "fare", expectedKeywords: ["fare", "base", "km", "split"] },
  { question: "How is the fare split between riders?", expectedTopic: "fare", expectedKeywords: ["split", "seats", "fare"] },
  { question: "Is RideMate safe to use?", expectedTopic: "safety", expectedKeywords: ["verified", "university email", "trust", "reliability"] },
  { question: "How do you verify drivers are trustworthy?", expectedTopic: "safety", expectedKeywords: ["verified", "rating", "reliability", "trust"] },
  { question: "What AI features does RideMate have?", expectedTopic: "ai-features", expectedKeywords: ["route matching", "fare", "reliability", "pickup", "recurring"] },
  { question: "Do you have smart pickup suggestions?", expectedTopic: "ai-features", expectedKeywords: ["pickup"] },
  { question: "Which universities are supported?", expectedTopic: "universities", expectedKeywords: ["university", "buet", "nsu", "aiub", "40"] },
  { question: "Is my university on RideMate?", expectedTopic: "universities", expectedKeywords: ["university", "email", "matched"] },
  { question: "Can I talk to a human about a problem?", expectedTopic: "human-support", expectedKeywords: ["support", "team", "email"] },
  { question: "I need to contact support directly", expectedTopic: "human-support", expectedKeywords: ["support", "flag", "team"] },
  { question: "What's the weather like in Dhaka today?", expectedTopic: "fallback", offTopic: true },
  { question: "Can you help me solve a calculus integral?", expectedTopic: "fallback", offTopic: true },
  { question: "What time does the sun set today?", expectedTopic: "fallback", offTopic: true },
];

function ruleBasedCorrect(actualTopic: string, tc: TestCase): boolean {
  if (tc.offTopic) return actualTopic === "fallback";
  return actualTopic === tc.expectedTopic;
}

function aiOnTopicHeuristic(reply: string, tc: TestCase): boolean | "manual-review" {
  const lower = reply.toLowerCase();
  if (tc.offTopic) return "manual-review"; // needs a human read: did it redirect, or actually answer?
  if (!tc.expectedKeywords) return "manual-review";
  return tc.expectedKeywords.some((kw) => lower.includes(kw.toLowerCase()));
}

async function main() {
  if (!isGeminiConfigured()) {
    console.error("GROQ_API_KEY not configured — cannot run the AI side of this comparison.");
    process.exit(1);
  }

  const rows: {
    question: string;
    expectedTopic: string;
    ruleTopic: string;
    ruleReply: string;
    ruleCorrect: boolean;
    aiReply: string;
    aiOnTopic: boolean | "manual-review";
  }[] = [];

  for (const tc of cases) {
    const rule = getChatbotReply(tc.question);
    const ai = await getAiChatbotReply(tc.question, []);
    rows.push({
      question: tc.question,
      expectedTopic: tc.expectedTopic,
      ruleTopic: rule.topicId,
      ruleReply: rule.reply,
      ruleCorrect: ruleBasedCorrect(rule.topicId, tc),
      aiReply: ai.reply,
      aiOnTopic: aiOnTopicHeuristic(ai.reply, tc),
    });
  }

  const ruleCorrectCount = rows.filter((r) => r.ruleCorrect).length;
  const aiAutoGraded = rows.filter((r) => r.aiOnTopic !== "manual-review");
  const aiCorrectCount = aiAutoGraded.filter((r) => r.aiOnTopic === true).length;

  let md = `# Chatbot Accuracy Comparison — Rule-Based vs. Real LLM (Groq)\n\n`;
  md += `Ran ${cases.length} fixed FAQ test cases through both engines.\n\n`;
  md += `## Summary\n\n`;
  md += `| Engine | Correct | Total scored | Accuracy |\n|---|---|---|---|\n`;
  md += `| Rule-based (keyword matching) | ${ruleCorrectCount} | ${cases.length} | ${Math.round((ruleCorrectCount / cases.length) * 100)}% |\n`;
  md += `| Real LLM (Groq / Llama 3.3 70B) | ${aiCorrectCount} | ${aiAutoGraded.length} (${cases.length - aiAutoGraded.length} off-topic cases need manual read) | ${Math.round((aiCorrectCount / aiAutoGraded.length) * 100)}% |\n\n`;
  md += `**Grading method:** rule-based is graded by exact topic-ID match (deterministic — it's keyword lookup). `;
  md += `The LLM is freeform text, so it's graded by a keyword-presence heuristic per topic (did the reply mention the facts a correct answer should contain) — this is a proxy for correctness, not true semantic grading. `;
  md += `Off-topic guardrail cases are left for manual review since "did it politely redirect vs. actually answer the unrelated question" isn't reliably checkable by keyword matching.\n\n`;
  md += `## Per-question results\n\n`;

  for (const r of rows) {
    md += `### "${r.question}"\n\n`;
    md += `Expected topic: \`${r.expectedTopic}\`\n\n`;
    md += `**Rule-based** (topic: \`${r.ruleTopic}\`, ${r.ruleCorrect ? "✅ correct" : "❌ wrong topic"}):\n`;
    md += `> ${r.ruleReply}\n\n`;
    md += `**AI (Groq)** (${r.aiOnTopic === "manual-review" ? "⚠️ manual review" : r.aiOnTopic ? "✅ on-topic" : "❌ missed expected facts"}):\n`;
    md += `> ${r.aiReply}\n\n`;
    md += `---\n\n`;
  }

  const fs = await import("fs");
  fs.writeFileSync("CHATBOT_ACCURACY_COMPARISON.md", md);
  console.log(md);
  console.log(`\nSaved to server/CHATBOT_ACCURACY_COMPARISON.md`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
