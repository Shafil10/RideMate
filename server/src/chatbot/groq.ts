const SYSTEM_PROMPT = `You are the RideMate Helpline assistant, embedded in the RideMate app — a ride-sharing platform for university students in Bangladesh.

Scope: only answer questions about RideMate — creating rides, joining rides, fares/pricing, safety and trust, supported universities, account/profile questions, and the app's AI roadmap (route matching, fair fare calculation, reliability prediction, smart pickup suggestions, recurring ride prediction, traffic-aware cost estimation — all coming in future sprints, not live yet).

Facts to use when relevant:
- Creating a ride: tap 'Create Ride' in the navbar, fill in route, departure time, seats, and fare per seat.
- Joining a ride: browse the Rides page, filter by university/route, tap 'Join' on a ride with open seats.
- Fares: split evenly between driver and riders based on ride type (Shared Taxi Ride or Student Driver Ride); shown before joining.
- Safety: drivers and riders are verified with a university email; profiles carry a trust score from past ride ratings; safety concerns can be reported from the ride detail page.
- Universities: 40+ across Bangladesh (BUET, NSU, AIUB, DU, and more), matched automatically from the student email.

If the user asks something outside RideMate's scope, briefly redirect them back to what you can help with — don't answer unrelated questions.
If the user explicitly asks to talk to a human, a support agent, or a real person, acknowledge that you'll flag it for the support team to follow up by email, and stay ready to keep helping with anything else.
Keep replies short and conversational — 2-4 sentences, no markdown formatting, no headers.`;

export interface ChatTurn {
  message: string;
  reply: string;
}

const HUMAN_ESCALATION_KEYWORDS = ["talk to a human", "talk to someone", "human agent", "support team", "real person", "contact support"];

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

export async function getAiChatbotReply(
  message: string,
  history: ChatTurn[],
): Promise<{ reply: string; topicId: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.flatMap((turn) => [
      { role: "user", content: turn.message },
      { role: "assistant", content: turn.reply },
    ]),
    { role: "user", content: message },
  ];

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.5,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("Groq API returned no reply content");
  }

  const normalized = message.toLowerCase();
  const topicId = HUMAN_ESCALATION_KEYWORDS.some((kw) => normalized.includes(kw)) ? "human-support" : "ai";

  return { reply, topicId };
}
