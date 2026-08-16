interface Topic {
  id: string;
  keywords: string[];
  reply: string;
}

const topics: Topic[] = [
  {
    id: "create-ride",
    keywords: ["create ride", "create a ride", "post a ride", "offer ride", "become a driver", "add ride", "make a ride"],
    reply:
      "To create a ride, tap 'Create Ride' in the navbar, then fill in your route, departure time, seats available, and fare per seat. Your ride goes live immediately for students on your route.",
  },
  {
    id: "join-ride",
    keywords: [
      "join ride",
      "join a ride",
      "book a seat",
      "find a ride",
      "search ride",
      "search for a ride",
      "search for available",
      "available ride",
      "book ride",
      "book a ride",
    ],
    reply:
      "Head to the Rides page to browse available rides filtered by university and route. Tap 'Join' on any ride with open seats to reserve your spot.",
  },
  {
    id: "fare",
    keywords: ["fare", "price", "cost", "split", "payment", "how much"],
    reply:
      "Fares are split evenly between the driver and all riders based on the ride type (Shared Taxi Ride or Student Driver Ride). You'll see the exact per-seat fare before joining.",
  },
  {
    id: "safety",
    keywords: ["safe", "safety", "trust", "verified", "security"],
    reply:
      "All drivers and riders are verified with a university email, and every profile carries a trust score built from past ride ratings. Report any safety concern from the ride detail page.",
  },
  {
    id: "ai-features",
    keywords: ["ai feature", "artificial intelligence", "the ai", "matching", "recommend", "prediction", "smart"],
    reply:
      "RideMate's AI features are live: geographic route matching, fair fare calculation (with rush-hour pricing), reliability scores from real ratings, smart pickup-point suggestions, and recurring-ride detection. Trust & safety enhancements are next on the roadmap.",
  },
  {
    id: "universities",
    keywords: ["university", "universities", "campus", "school"],
    reply:
      "RideMate currently supports 40+ universities across Bangladesh including BUET, NSU, AIUB, DU, and more. Your university is matched automatically from your student email.",
  },
  {
    id: "human-support",
    keywords: ["human", "agent", "support team", "talk to someone", "contact support"],
    reply:
      "I'll flag this for our support team to follow up by email. In the meantime, feel free to ask me about creating rides, joining rides, fares, or safety.",
  },
];

const fallbackReply =
  "I'm not sure about that one yet — I can help with creating rides, joining rides, fares, safety, or supported universities. You can also ask to talk to a human agent.";

export function getChatbotReply(message: string): { reply: string; topicId: string } {
  const normalized = message.toLowerCase();

  for (const topic of topics) {
    if (topic.keywords.some((keyword) => normalized.includes(keyword))) {
      return { reply: topic.reply, topicId: topic.id };
    }
  }

  return { reply: fallbackReply, topicId: "fallback" };
}
