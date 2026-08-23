import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";
import { sendChatMessage } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

interface ChatMessage {
  id: number;
  sender: "user" | "bot";
  text: string;
}

let nextId = 1;

function getSessionId(): string {
  const key = "ridemate-chat-session-id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

const welcomeMessage: ChatMessage = {
  id: 0,
  sender: "bot",
  text: "Hi! I'm the RideMate Helpline bot. Ask me about creating rides, joining rides, fares, safety, or supported universities.",
};

export default function ChatboxWidget() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { id: nextId++, sender: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const { reply } = await sendChatMessage(text, getSessionId(), token);
      setMessages((prev) => [...prev, { id: nextId++, sender: "bot", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId++, sender: "bot", text: "Sorry, I'm having trouble connecting right now. Please try again shortly." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed right-5 z-[1000]" style={{ bottom: "max(calc(env(safe-area-inset-bottom) + 84px), 96px)" }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="h-[440px] w-[min(90vw,340px)] bg-card rounded-3xl shadow-[0_16px_48px_rgba(15,23,42,0.22)] flex flex-col overflow-hidden border border-border/60 mb-4"
          >
            <div className="bg-primary text-white px-5 py-4 font-bold font-display flex items-center justify-between">
              RideMate Helpline
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-white/90">
                <X size={18} />
              </button>
            </div>

            <div ref={bodyRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-2.5">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug ${
                    m.sender === "user" ? "self-end bg-primary text-white" : "self-start bg-slate-100 text-text"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {sending && <div className="self-start text-text-muted text-xs">Helpline is typing…</div>}
            </div>

            <form onSubmit={handleSend} className="flex border-t border-border/60 p-2 gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 border-none outline-none px-3 py-2.5 text-sm bg-transparent"
              />
              <button
                type="submit"
                disabled={sending}
                aria-label="Send message"
                className="h-10 w-10 rounded-full bg-primary text-white grid place-items-center disabled:opacity-50 shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle helpline chat"
        className="h-14 w-14 rounded-full bg-primary text-white grid place-items-center shadow-[0_10px_28px_rgba(22,163,74,0.4)]"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>
    </div>
  );
}
