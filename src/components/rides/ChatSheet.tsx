import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { BottomSheet, useToast } from "../ui";
import { fetchMessages, sendMessage, type ChatMessage } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const POLL_MS = 4000;

interface ChatSheetProps {
  open: boolean;
  onClose: () => void;
  rideId: string;
  otherUserId: string;
  otherUserName: string;
}

export default function ChatSheet({ open, onClose, rideId, otherUserId, otherUserName }: ChatSheetProps) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function load() {
    if (!token) return;
    fetchMessages(rideId, otherUserId, token)
      .then((data) => setMessages(data.messages))
      .catch(() => {});
  }

  useEffect(() => {
    if (!open) return;
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rideId, otherUserId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function handleSend() {
    const body = draft.trim();
    if (!body || !token || sending) return;
    setSending(true);
    try {
      const { message } = await sendMessage(rideId, otherUserId, body, token);
      setMessages((prev) => [...prev, message]);
      setDraft("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't send that — try again.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={otherUserName}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-6">
              No messages yet — say hello to {otherUserName.split(" ")[0]}.
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.isMine ? "self-end bg-primary text-white rounded-br-md" : "self-start bg-slate-100 text-text rounded-bl-md"
                }`}
              >
                {m.body}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-end gap-2 pt-2 border-t border-border/60">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text max-h-24"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            aria-label="Send"
            className="h-11 w-11 shrink-0 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
