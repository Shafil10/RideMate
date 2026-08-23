import { useState } from "react";
import { Button, Card, Input, StarRating, useToast } from "../ui";
import { submitRating, type RideHistoryEntry } from "../../lib/api";

interface RatingPromptProps {
  history: RideHistoryEntry[];
  token: string;
  onRated?: () => void;
}

export default function RatingPrompt({ history, token, onRated }: RatingPromptProps) {
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, { score: number; comment: string }>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const pending = history.flatMap((h) => h.counterparts.filter((c) => !c.alreadyRated).map((c) => ({ h, c })));
  if (pending.length === 0) return null;

  async function handleSubmit(rideId: string, ratedUserId: string) {
    const key = `${rideId}:${ratedUserId}`;
    const draft = drafts[key] ?? { score: 5, comment: "" };
    setBusyKey(key);
    try {
      await submitRating(rideId, ratedUserId, draft.score, draft.comment || undefined, token);
      showToast("Thanks for the feedback!");
      onRated?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not submit rating.", "error");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-bold text-text">Rate your past rides</h2>
      {pending.map(({ h, c }) => {
        const key = `${h.id}:${c.userId}`;
        const draft = drafts[key] ?? { score: 5, comment: "" };
        const busy = busyKey === key;
        return (
          <Card key={key} className="flex flex-col gap-2.5">
            <div className="text-sm font-bold text-text">
              {h.origin} → {h.destination}
            </div>
            <div className="text-xs text-text-muted">
              {new Date(h.departureTime).toLocaleDateString()} · Rate {h.isDriver ? "rider" : "driver"}{" "}
              <strong>{c.name}</strong>
            </div>
            <StarRating value={draft.score} onChange={(v) => setDrafts((d) => ({ ...d, [key]: { ...draft, score: v } }))} size={22} />
            <Input
              placeholder="Optional comment"
              value={draft.comment}
              onChange={(e) => setDrafts((d) => ({ ...d, [key]: { ...draft, comment: e.target.value } }))}
            />
            <Button size="sm" onClick={() => handleSubmit(h.id, c.userId)} loading={busy}>
              Submit rating
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
