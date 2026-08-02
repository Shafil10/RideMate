import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { fetchChatbotSuggestions, sendChatMessage } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

interface ChatMessage {
  id: number;
  sender: "user" | "bot";
  text: string;
}

let nextId = 1;

const welcomeMessage: ChatMessage = {
  id: 0,
  sender: "bot",
  text: "Hi! I'm the RideMate Helpline bot. Ask me about creating rides, joining rides, pickup points, fares, purchase history, safety, or supported universities.",
};

const defaultSuggestions = [
  "How do I create a ride?",
  "How do I join a ride?",
  "What is a pickup point?",
  "Where can I see my purchase history?",
];

export default function ChatboxWidget() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    fetchChatbotSuggestions()
      .then((data) => setSuggestions(data.suggestions))
      .catch(() => {});
  }, []);

  async function sendText(text: string) {
    if (!text || sending) return;

    setMessages((prev) => [...prev, { id: nextId++, sender: "user", text }]);
    setInput("");
    setSending(true);
    setSuggestions([]);

    try {
      const { reply, suggestions: nextSuggestions } = await sendChatMessage(text, token);
      setMessages((prev) => [...prev, { id: nextId++, sender: "bot", text: reply }]);
      setSuggestions(nextSuggestions.length > 0 ? nextSuggestions : defaultSuggestions);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId++, sender: "bot", text: "Sorry, I'm having trouble connecting right now. Please try again shortly." },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    sendText(input.trim());
  }

  return (
    <div className="chatbox-widget" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000 }}>
      {open && (
        <div
          className="chatbox-panel"
          style={{
            height: 460,
            background: "white",
            borderRadius: 16,
            boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            marginBottom: 16,
            overflow: "hidden",
            border: "1px solid #ececec",
          }}
        >
          <div
            style={{
              background: "#16a34a",
              color: "white",
              padding: "16px 20px",
              fontWeight: 700,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            RideMate Helpline
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex" }}
            >
              <X size={18} />
            </button>
          </div>

          <div ref={bodyRef} style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  background: m.sender === "user" ? "#16a34a" : "#f3f4f6",
                  color: m.sender === "user" ? "white" : "#111827",
                  padding: "10px 14px",
                  borderRadius: 14,
                  maxWidth: "85%",
                  fontSize: 14,
                  lineHeight: 1.4,
                }}
              >
                {m.text}
              </div>
            ))}
            {sending && (
              <div style={{ alignSelf: "flex-start", color: "#9ca3af", fontSize: 13 }}>Helpline is typing...</div>
            )}
          </div>

          {suggestions.length > 0 && !sending && (
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "0 12px 10px",
                overflowX: "auto",
                borderTop: "1px solid #ececec",
                paddingTop: 10,
              }}
            >
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendText(s)}
                  style={{
                    flexShrink: 0,
                    background: "#f3f4f6",
                    color: "#16a34a",
                    border: "1px solid #d1fae5",
                    borderRadius: 20,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: "flex", borderTop: "1px solid #ececec", padding: 8, gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              style={{ flex: 1, border: "none", outline: "none", padding: "10px 12px", fontSize: 14 }}
            />
            <button
              type="submit"
              disabled={sending}
              aria-label="Send message"
              style={{
                background: "#16a34a",
                border: "none",
                borderRadius: "50%",
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
                color: "white",
                cursor: "pointer",
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle helpline chat"
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "#16a34a",
          color: "white",
          border: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
        }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
