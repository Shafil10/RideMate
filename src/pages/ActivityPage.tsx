import { useEffect, useState } from "react";
import { ArrowRight, Car, MapPin } from "lucide-react";
import { fetchRideHistory, type RideHistoryEntry } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Card, CardSkeleton, Chip, EmptyState } from "../components/ui";
import RatingPrompt from "../components/rides/RatingPrompt";
import EmptyActivityIllustration from "../components/illustrations/EmptyActivityIllustration";

export default function ActivityPage() {
  const { token } = useAuth();
  const [history, setHistory] = useState<RideHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    if (!token) return;
    fetchRideHistory(token)
      .then((data) => setHistory(data.history))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) return null;

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-28 flex flex-col gap-7">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-text">Activity</h1>
        <p className="text-text-muted text-sm mt-1">Where you've been.</p>
      </div>

      <RatingPrompt history={history} token={token} onRated={load} />

      {loading ? (
        <div className="flex flex-col gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          illustration={<EmptyActivityIllustration />}
          title="No rides yet"
          subtitle="Your completed rides will show up here once you start riding."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((h) => (
            <Card key={h.id} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <Chip tone={h.isDriver ? "driver" : "primary"} icon={h.isDriver ? <Car size={11} /> : <MapPin size={11} />}>
                  {h.isDriver ? "Drove" : "Rode"}
                </Chip>
                <span className="text-xs text-text-muted">{new Date(h.departureTime).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5 font-display font-bold text-text text-[15px]">
                <span className="truncate">{h.origin}</span>
                <ArrowRight size={14} className="text-text-muted shrink-0" />
                <span className="truncate">{h.destination}</span>
              </div>
              <div className="text-xs text-text-muted">
                with {h.counterparts.map((c) => c.name).join(", ") || "no one else"}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
