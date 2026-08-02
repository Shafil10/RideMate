interface Topic {
  id: string;
  keywords: string[];
  reply: string;
  suggestions?: string[];
}

const topics: Topic[] = [
  {
    id: "create-ride",
    keywords: ["create ride", "create a ride", "post a ride", "offer ride", "become a driver", "add ride", "make a ride"],
    reply:
      "To create a ride, tap 'Create Ride' in the navbar, then fill in your route, pickup point, departure time, seats offered, and fare per seat. Your ride goes live immediately for students on your route.",
    suggestions: ["What is a pickup point?", "How is fare split?"],
  },
  {
    id: "pickup-point",
    keywords: ["pickup point", "pickup location", "exact location", "exact point", "where do i get picked", "meeting point"],
    reply:
      "The pickup point is the exact spot the driver picks you up from — a road, house number, or nearby landmark — set by the driver when creating the ride. It's shown on the ride card and in your purchase history so you know exactly where to be.",
  },
  {
    id: "join-ride",
    keywords: ["join ride", "join a ride", "book a seat", "find a ride", "search ride", "book ride", "book a ride"],
    reply:
      "Head to the Rides page to browse available rides filtered by university and route. Pick how many seats you need and tap 'Join' to reserve your spot — you'll see the total price before confirming.",
    suggestions: ["How many seats can I book?", "Where can I see my bookings?"],
  },
  {
    id: "seats",
    keywords: ["how many seats", "seat limit", "seats available", "seats left", "capacity"],
    reply:
      "You can join with as many seats as are still open on a ride — the Join button shows the remaining capacity and blocks you from booking more than what's left.",
  },
  {
    id: "fare",
    keywords: ["fare", "price", "cost", "split", "payment", "how much", "pay"],
    reply:
      "Fares are set per seat by the driver based on the ride type (Shared Taxi Ride or Student Driver Ride). You'll see the exact per-seat fare and your total before joining. Payment is settled directly with the driver — RideMate doesn't process payments yet.",
  },
  {
    id: "purchase-history",
    keywords: ["purchase history", "my bookings", "booking history", "past rides", "previous rides", "history", "receipts"],
    reply:
      "Every ride you've joined and paid for is listed on the 'My Bookings' page (in the navbar once you're logged in), including the route, pickup point, seats booked, and price paid.",
  },
  {
    id: "cancel",
    keywords: ["cancel", "cancellation", "refund", "change booking", "edit ride"],
    reply:
      "Ride cancellation and editing aren't self-serve yet — message your driver or rider directly to sort out changes. We're adding in-app cancellation soon.",
  },
  {
    id: "safety",
    keywords: ["safe", "safety", "trust", "verified", "security", "women only", "women-only"],
    reply:
      "All drivers and riders are verified with a university email. Women-only ride options are available from some drivers — check the ride details before joining. Report any safety concern from the ride detail page.",
  },
  {
    id: "ai-features",
    keywords: ["ai", "matching", "recommend", "prediction", "smart"],
    reply:
      "AI-powered route matching, fair fare calculation, reliability prediction, smart pickup suggestions, recurring ride prediction, and traffic-aware cost estimation are on our roadmap for upcoming sprints.",
  },
  {
    id: "universities",
    keywords: ["university", "universities", "campus", "school"],
    reply:
      "RideMate currently supports key Dhaka universities including BUET, NSU, AIUB, BRAC, DU, UIU, DIU, and East West University — pick yours from the dropdown when creating or filtering rides.",
  },
  {
    id: "account",
    keywords: ["login", "log in", "signup", "sign up", "account", "password", "demo account"],
    reply:
      "Sign up with your university email and a password to create an account, or use the demo login (demo@ridemate.app / demo1234) to explore RideMate without registering.",
  },
  {
    id: "human-support",
    keywords: ["human", "agent", "support team", "talk to someone", "contact support", "emergency"],
    reply:
      "I'll flag this for our support team to follow up by email. In the meantime, feel free to ask me about creating rides, joining rides, pickup points, fares, purchase history, or safety.",
  },
];

export const chatbotSuggestions = [
  "How do I create a ride?",
  "How do I join a ride?",
  "What is a pickup point?",
  "Where can I see my purchase history?",
];

const fallbackReply =
  "I'm not sure about that one yet — I can help with creating rides, joining rides, pickup points, fares, purchase history, safety, or supported universities. You can also ask to talk to a human agent.";

export function getChatbotReply(message: string): { reply: string; topicId: string; suggestions: string[] } {
  const normalized = message.toLowerCase();

  for (const topic of topics) {
    if (topic.keywords.some((keyword) => normalized.includes(keyword))) {
      return { reply: topic.reply, topicId: topic.id, suggestions: topic.suggestions ?? [] };
    }
  }

  return { reply: fallbackReply, topicId: "fallback", suggestions: chatbotSuggestions };
}
